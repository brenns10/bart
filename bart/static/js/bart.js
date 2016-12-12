var randomChoice = function (list) {
    return list[Math.floor(Math.random()*list.length)];
};
var ENDPOINT_STATIONS = '/api/v1/stations';
var ENDPOINT_TRAVEL = '/api/v1/travel';
var ENDPOINT_RESULT = '/api/v1/result';
var ENDPOINT_CALCULATE = '/api/v1/calculate';
var stations = [];
var travelers = [];

var bart_manual = (function() {

    var NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Elizabeth", "William", "Linda", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Margaret", "Charles", "Sarah", "Christopher", "Karen", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Dorothy", "Donald", "Lisa", "Mark", "Sandra", "Paul", "Ashley", "Steven", "Kimberly", "George", "Donna", "Kenneth", "Carol", "Andrew", "Michelle", "Joshua", "Emily", "Edward", "Helen", "Brian", "Amanda", "Kevin", "Melissa", "Ronald", "Deborah", "Timothy", "Stephanie", "Jason", "Laura", "Jeffrey", "Rebecca", "Ryan", "Sharon", "Gary", "Cynthia", "Jacob", "Kathleen", "Nicholas", "Shirley", "Eric", "Amy", "Stephen", "Anna", "Jonathan", "Angela", "Larry", "Ruth", "Scott", "Brenda", "Frank", "Pamela", "Justin", "Virginia", "Brandon", "Katherine", "Raymond", "Nicole", "Gregory", "Catherine", "Samuel", "Christine", "Benjamin", "Samantha", "Patrick", "Debra", "Jack", "Janet", "Alexander", "Carolyn", "Dennis", "Rachel", "Jerry", "Heather", "Tyler", "Maria", "Aaron", "Diane", "Henry", "Emma", "Douglas", "Julie", "Peter", "Joyce", "Jose", "Frances", "Adam", "Evelyn", "Zachary", "Joan", "Walter", "Christina", "Nathan", "Kelly", "Harold", "Martha", "Kyle", "Lauren", "Carl", "Victoria", "Arthur", "Judith", "Gerald", "Cheryl", "Roger", "Megan", "Keith", "Alice", "Jeremy", "Ann", "Lawrence", "Jean", "Terry", "Doris", "Sean", "Andrea", "Albert", "Marie", "Joe", "Kathryn", "Christian", "Jacqueline", "Austin", "Gloria", "Willie", "Teresa", "Jesse", "Hannah", "Ethan", "Sara", "Billy", "Janice", "Bruce", "Julia", "Bryan", "Olivia", "Ralph", "Grace", "Roy", "Rose", "Jordan", "Theresa", "Eugene", "Judy", "Wayne", "Beverly", "Louis", "Denise", "Dylan", "Marilyn", "Alan", "Amber", "Juan", "Danielle", "Noah", "Brittany", "Russell", "Madison", "Harry", "Diana", "Randy", "Jane", "Philip", "Lori", "Vincent", "Mildred", "Gabriel", "Tiffany", "Bobby", "Natalie", "Johnny", "Abigail", "Howard", "Kathy"];
    var INITIALS = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "N.", "O.", "P.", "Q.", "R.", "S.", "T.", "U.", "V.", "W.", "X.", "Y.", "Z."];



    /**
       Updates the start and end boxes to contain the correct station listings.
     */
    var updateStationChoices = function() {
        var start = $("#travel-start");
        var end = $("#travel-end");
        start.find('option').remove().end();
        end.find('option').remove().end();
        console.log(start);
        console.log(end);
        $(stations).each(function(i, v) {
            start.append($("<option>", {value: v, html: v}));
            end.append($("<option>", {value: v, html: v}));
        });
    }

    /**
       Downloads the BART station listing from the API endpoint into the
       `stations` variable.
     */
    var downloadStations = function(callback) {
        $.getJSON(ENDPOINT_STATIONS, function (data) {
            stations = data.stations;
            if (callback != null) {callback();}
        });
    };

    /**
       Download stations and set them in the boxes.
    */
    var updateStations = function () {
        downloadStations(updateStationChoices);
    }

    /**
       Sets a random name in the manual entry box.
     */
    var updateName = function() {
        $("#travel-name")[0].value = randomChoice(NAMES) + ' ' + randomChoice(INITIALS);
    };

    /**
       Return HTML as a string for a given traveler object.
     */
    var renderTraveler = function(traveler) {
        return "<tr>" +
            "<td>" + traveler.name + "</td>" +
            "<td>" + traveler.start + "</td>" +
            "<td>" + traveler.end + "</td>" +
            "<td><code>" + traveler.uuid + "</code></td>" +
            "<td>" + traveler.status + "(" +
            Number(traveler.fare_opt).toFixed(2) + "/" + Number(traveler.fare_orig).toFixed(2) +
            ")" + "</td>" +
            "</tr>";
    };

    /**
       Remove all entries from the traveler table.
     */
    var clearTravelerTable = function() {
        $("#traveler-list").find("tr").remove();
    };

    /**
       Remove all travelers from the traveler list and traveler table.
     */
    var clearTravelers = function() {
        clearTravelerTable();
        travelers = [];
    };

    /**
       Check each traveler's status and refresh the table when done.
     */
    var updateTravelers = function() {
        clearTravelerTable();

        var remainingTravelers = travelers.length;
        $(travelers).each(function (i,v) {
            $.getJSON(ENDPOINT_RESULT + "/" + v.uuid, function(data){
                if (data.status === "PROCESSING") {
                    v.status = data.status;
                } else {
                    v.status = data.exit_id;
                    v.fare_opt = data.fare_opt;
                }

                // This is a horrible hack because I only have a function that
                // renders a whole table instead of updating a single row. It
                // waits until every traveler is updated and then re-fills the
                // table. I should work on a way to refresh the table without
                // deleting everything and re-filling it. I'm sure this is a
                // solved problem in JS-world.
                remainingTravelers -= 1;
                if (remainingTravelers == 0) {
                    $(travelers).each(function (i, v) {
                        $("#traveler-list").append(renderTraveler(v));
                    });
                }
            });
        });
    };

    /**
       Take the given info, create a traveler object, and add it to the table
       and list of travelers.
     */
    var addTraveler = function (name, start, end, uuid, fare_orig) {
        var traveler = {
            name: name,
            start: start,
            end: end,
            uuid: uuid,
            fare_orig: fare_orig,
            fare_opt: "???",
            status: "PROCESSING",
        };
        travelers.push(traveler);
        $("#traveler-list").append(renderTraveler(traveler));
    };

    /**
       POST the form data to the travel endpoint, and on success add the
       returned traveler to the table.
     */
    var sendTravel = function() {
        var start = $("#travel-start")[0].value;
        var end = $("#travel-end")[0].value;
        var name = $("#travel-name")[0].value
        $.ajax({
            type: 'POST',
            url: ENDPOINT_TRAVEL,
            data: JSON.stringify({
                start: start,
                end: end,
                id: name,
            }),
            contentType: 'application/json',
            dataType: 'json',
        }).done(function(data) {
            updateName();
            addTraveler(name, start, end, data['token'], data['fare_orig'])
        });
    };

    /**
       Execute the batch calculate endpoint.
     */
    var calculate = function() {
        $.getJSON(ENDPOINT_CALCULATE, function (data) {
            $("#computation-results").html(
                "<ul>" +
                    "<li>Status: " + data["status"] + "</li>" +
                    "<li>Total Original Fare: " + data["cost_orig"] + "</li>" +
                    "<li>Optimal Total Fare: " + data["cost_opt"] + "</li>" +
                    "<li>Percent of Original: " + data["discount"] + "</li>" +
                "</ul>"
            );
            updateTravelers();
        });
    };

    $(document).ready(updateStations);
    $(document).ready(updateName);

    return {
        updateStations: updateStations,
        updateName: updateName,
        sendTravel: sendTravel,
        updateTravelers: updateTravelers,
        clearTravelers: clearTravelers,
        calculate: calculate,
    };
}());

var bart_simulation = (function () {
    // scary state maintained during simulation
    var events = [];
    var currentHour = 0;

    // for plots
    var fareSavings = [];
    var fareDiscounts = [];
    var fareOriginal = [];
    var fareOptimal = [];

    var stations = {
        "12TH": "12th St/Oakland",
        "19TH": "19th St/Oakland",
        "16TH": "16th St Mission",
        "24TH": "24th St Mission",
        "ASHB": "Ashby",
        "BALB": "Balboa Park",
        "BAYF": "Bay Fair",
        "CAST": "Castro Valley",
        "CIVC": "Civic Center/UN Plaza",
        "COLS": "Coliseum",
        "COLM": "Colma",
        "CONC": "Concord",
        "DALY": "Daly City",
        "DBRK": "Downtown Berkeley",
        "DUBL": "Dublin/Pleasanton",
        "DELN": "El Cerrito del Norte",
        "PLZA": "El Cerrito Plaza",
        "EMBR": "Embarcadero",
        "FRMT": "Fremont",
        "FTVL": "Fruitvale",
        "GLEN": "Glen Park",
        "HAYW": "Hayward",
        "LAFY": "Lafayette",
        "LAKE": "Lake Merritt",
        "MCAR": "MacArthur",
        "MLBR": "Millbrae",
        "MONT": "Montgomery",
        "NBRK": "North Berkeley",
        "NCON": "North Concord/Martinez",
        "OAKL": "OAK Airport",
        "ORIN": "Orinda",
        "PITT": "Pittsburg/Bay Point",
        "PHIL": "Pleasant Hill/Contra Costa",
        "POWL": "Powell",
        "RICH": "Richmond",
        "ROCK": "Rockridge",
        "SBRN": "San Bruno",
        "SFIA": "SFO Airport",
        "SANL": "San Leandro",
        "SHAY": "South Hayward",
        "SSAN": "South San Francisco",
        "UCTY": "Union City",
        "WCRK": "Walnut Creek",
        "WDUB": "West Dublin/Pleasanton",
        "WOAK": "West Oakland",
    };

    /*
      This horror show of a function parses a very large CSV file and calls a
      callback with each line. In particular, the callback returns true if we
      should keep reading, or false if we should stop. No guarantee that we will
      stop immediately after the function returns false for the first time, just
      that we will stop eventually.
      file - File to read
      progress - Progress bar to update
      callback - Function to call with each line. Should return boolean to say
                 whether we should continue reading
      onComplete - Called once we have terminated reading.
     */
    var parseBigFileByLines = function(file, progress, callback, onComplete) {
        // Related: http://stackoverflow.com/questions/14438187/javascript-filereader-parsing-long-file-in-chunks
        var fileSize = file.size;
        var chunkSize = 64 * 1024; // why not
        var offset = 0; // where are we currently?
        var residualLine = "";
        var readBlock = null;

        var readEventHandler = function(e) {
            if (e.target.error == null) {
                offset += e.target.result.length;
                progress.style.setProperty("width", (offset/fileSize*100).toFixed(0) + "%");
                var lines = e.target.result.split(/\r?\n/);
                var firstLine = residualLine + lines[0];
                var cont = callback(firstLine);
                if (!cont) {
                    console.log("Early termination!");
                    progress.style.setProperty("width", "100%");
                    onComplete();
                    return;
                }
                lines.slice(1,-1).forEach(callback);
                residualLine = lines[lines.length-1];
            } else {
                console.log("Read error: " + e.target.error);
                return;
            }
            if (offset >= fileSize) {
                callback(residualLine);
                progress.style.setProperty("width", "100%");
                onComplete();
                return;
            }
            readBlock(offset, chunkSize, file);
        };

        readBlock = function(_offset, length, _file) {
            var r = new FileReader();
            var blob = _file.slice(_offset, _offset + length);
            r.onload = readEventHandler;
            r.readAsText(blob);
        };

        readBlock(offset, chunkSize, file);
    };

    /*
      Update statistics after an hour has been calculated successfully.
     */
    var updateHour = function(data) {
        fareDiscounts.push([currentHour, Number(data["discount"])]);
        fareSavings.push([currentHour, Number(data["cost_orig"]) - Number(data["cost_opt"])]);
        fareOptimal.push([currentHour, Number(data["cost_opt"])]);
        fareOriginal.push([currentHour, Number(data["cost_orig"])]);
        $.plot($("#sim-fraction"),[fareDiscounts], {
            yaxis: {
                max: 1,
                min: 0,
            },
            xaxis: {
                min: 0,
                max: 24,
            }
        });
        $.plot($("#sim-savings"),[fareSavings], {
            yaxis: {
                min: 0,
            },
            xaxis: {
                min: 0,
                max: 24,
            }
        });
        $.plot($("#sim-costs"),[fareOriginal, fareOptimal], {
            yaxis: {
                min: 0,
            },
            xaxis: {
                min: 0,
                max: 24,
            }
        });
        currentHour += 1;
        if (currentHour < 24) {
            submitHour();
        } else {
            $("#sim-results").html(
                "<p>Simulation Complete</p>"
            );
        }
    };

    /*
      Call the calculate endpoint after an hour has been submitted.
     */
    var calculateHour = function() {
        console.log("Hitting calculate endpoint for hour " + currentHour);
        $("#sim-results").html(
            "<p>All travelers for hour " + currentHour + " loaded, calculating...</p>"
        );
        $.ajax({
            type: 'GET',
            url: ENDPOINT_CALCULATE,
            dataType: 'json'
        }).done(updateHour);
    };

    /*
      Return a list of events for a given hour.
     */
    var eventsInHour = function(hour) {
        var list = [];
        events.forEach(function(val, i) {
            if (val.hour == hour) {
                list.push(val);
            }
        });
        return list;
    };

    /*
      Submit an hour's worth of simulation data to the server.
     */
    var submitHour = function () {
        // Get the event objects for just this hour.
        var events = eventsInHour(currentHour);
        var remaining = events.length;

        // UI updates
        console.log("For hour " + currentHour + ", submitting " + remaining + " events");
        $("#sim-results").html(
            "<p>Sending " + remaining + " travelers for hour " + currentHour + " to the server...</p>"
        );

        // Submit every rider, and once all are submitted, proceed.
        Promise.all(events.map((event) => $.ajax({
            type: 'POST',
            url: ENDPOINT_TRAVEL,
            data: JSON.stringify({
                start: stations[event.start],
                end: stations[event.end],
                id: 'does not matter',
                count: event.count
            }),
            contentType: 'application/json',
            dataType: 'json'
        }))).then(calculateHour);
    };

    /*
      Runs a full simulation on a day's worth of data.
     */
    var runSimulation = function (e) {
        var file = $("#sim-file").prop("files")[0];
        var date = $("#sim-date").val();
        console.log("Simulating for date " + date);
        var rangeFound = false;
        parseBigFileByLines(file, $("#sim-load-progress")[0], function (line) {
            // Signal termination when we read day after.
            if (!line.startsWith(date)) {
                return !rangeFound;
            }
            rangeFound = true;
            var fields = line.split(/,/);
            events.push({
                date: new Date(fields[0]),
                hour: Number(fields[1]),
                start: fields[2],
                end: fields[3],
                count: Number(fields[4])
            });
            return true;
        }, function () {
            currentHour=0;
            submitHour();
        });
    };

    // Exports:
    return {
        runSimulation: runSimulation,
    };
}());
