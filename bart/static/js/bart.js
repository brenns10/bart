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

    var updateStations = function() {
        $.getJSON(ENDPOINT_STATIONS, function (data) {
            stations = data.stations;
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
        });
    };

    var updateName = function() {
        $("#travel-name")[0].value = randomChoice(NAMES) + ' ' + randomChoice(INITIALS);
    };

    var renderTraveler = function(traveler) {
        return "<tr>" +
            "<td>" + traveler.name + "</td>" +
            "<td>" + traveler.start + "</td>" +
            "<td>" + traveler.end + "</td>" +
            "<td><code>" + traveler.uuid + "</code></td>" +
            "<td>" + traveler.status + "(" + traveler.fare_opt + "/" + traveler.fare_orig + ")" + "</td>" +
            "</tr>";
    };

    var checkTraveler = function(traveler) {
        $.getJSON(ENDPOINT_RESULT, function(data){

        });
    };

    var clearTravelerTable = function() {
        $("#traveler-list").find("tr").remove();
    }

    var clearTravelers = function() {
        clearTravelerTable();
        travelers = [];
    }

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

                remainingTravelers -= 1;
                if (remainingTravelers == 0) {
                    $(travelers).each(function (i, v) {
                        $("#traveler-list").append(renderTraveler(v));
                    });
                }
            });
        });
    };

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
