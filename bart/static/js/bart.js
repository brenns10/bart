var bart = (function() {

    var NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Elizabeth", "William", "Linda", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Margaret", "Charles", "Sarah", "Christopher", "Karen", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Dorothy", "Donald", "Lisa", "Mark", "Sandra", "Paul", "Ashley", "Steven", "Kimberly", "George", "Donna", "Kenneth", "Carol", "Andrew", "Michelle", "Joshua", "Emily", "Edward", "Helen", "Brian", "Amanda", "Kevin", "Melissa", "Ronald", "Deborah", "Timothy", "Stephanie", "Jason", "Laura", "Jeffrey", "Rebecca", "Ryan", "Sharon", "Gary", "Cynthia", "Jacob", "Kathleen", "Nicholas", "Shirley", "Eric", "Amy", "Stephen", "Anna", "Jonathan", "Angela", "Larry", "Ruth", "Scott", "Brenda", "Frank", "Pamela", "Justin", "Virginia", "Brandon", "Katherine", "Raymond", "Nicole", "Gregory", "Catherine", "Samuel", "Christine", "Benjamin", "Samantha", "Patrick", "Debra", "Jack", "Janet", "Alexander", "Carolyn", "Dennis", "Rachel", "Jerry", "Heather", "Tyler", "Maria", "Aaron", "Diane", "Henry", "Emma", "Douglas", "Julie", "Peter", "Joyce", "Jose", "Frances", "Adam", "Evelyn", "Zachary", "Joan", "Walter", "Christina", "Nathan", "Kelly", "Harold", "Martha", "Kyle", "Lauren", "Carl", "Victoria", "Arthur", "Judith", "Gerald", "Cheryl", "Roger", "Megan", "Keith", "Alice", "Jeremy", "Ann", "Lawrence", "Jean", "Terry", "Doris", "Sean", "Andrea", "Albert", "Marie", "Joe", "Kathryn", "Christian", "Jacqueline", "Austin", "Gloria", "Willie", "Teresa", "Jesse", "Hannah", "Ethan", "Sara", "Billy", "Janice", "Bruce", "Julia", "Bryan", "Olivia", "Ralph", "Grace", "Roy", "Rose", "Jordan", "Theresa", "Eugene", "Judy", "Wayne", "Beverly", "Louis", "Denise", "Dylan", "Marilyn", "Alan", "Amber", "Juan", "Danielle", "Noah", "Brittany", "Russell", "Madison", "Harry", "Diana", "Randy", "Jane", "Philip", "Lori", "Vincent", "Mildred", "Gabriel", "Tiffany", "Bobby", "Natalie", "Johnny", "Abigail", "Howard", "Kathy"];
    var INITIALS = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "N.", "O.", "P.", "Q.", "R.", "S.", "T.", "U.", "V.", "W.", "X.", "Y.", "Z."];

    var ENDPOINT_STATIONS = '/api/v1/stations';
    var ENDPOINT_TRAVEL = '/api/v1/travel';
    var ENDPOINT_RESULT = '/api/v1/result';
    var ENDPOINT_CALCULATE = '/api/v1/calculate';
    var stations = [];
    var travelers = [];

    var randomChoice = function (list) {
        return list[Math.floor(Math.random()*list.length)];
    };


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
