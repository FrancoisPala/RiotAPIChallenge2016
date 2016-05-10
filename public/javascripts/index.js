/**
 * Created by Jam on 03-May-16.
 */
var socket = io();

// Map used to sort champions by highest grade earned this season
var GRADESMIX = {};
    GRADESMIX["S+"] = "A";
    GRADESMIX["S"] = "B";
    GRADESMIX["S-"] = "C";
    GRADESMIX["A+"] = "D";
    GRADESMIX["A"] = "E";
    GRADESMIX["A-"] = "F";
    GRADESMIX["B+"] = "G";
    GRADESMIX["B"] = "H";
    GRADESMIX["B-"] = "I";
    GRADESMIX["C+"] = "J";
    GRADESMIX["C"] = "K";
    GRADESMIX["C-"] = "L";
    GRADESMIX["D+"] = "M";
    GRADESMIX["D"] = "N";
    GRADESMIX["D-"] = "O";

// function used to validate the form of the user. Once the program validates summoner name and region, we send the event to the server to process the data.
function validate(option) {
    var summName;
    var region;
    if (option == 'main'){
        summName = document.forms["form"]["summName"].value;
        region = document.forms["form"]["regions"].value;
    }
    else if (option == 'head') {
        summName = document.forms["formHead"]["summName"].value;
        region = document.forms["formHead"]["regions"].value;
        $("input.byname").val("");
        $(".mySN").val("");
        $(".summoner").html("");
    }
    if (summName && region) {
        socket.emit("client info", summName + "," + region);
    }
    else {
        $('#subBut').css("display", "block");
    }
    return false;
}

// Function used to display all the champion mastery information retrieved for the current summoner on the page
function displayChampInfos(elem, index, array) {
    var toAppend = '<div class=" mix champion col-md-3 col-xs-12 name-' + elem.name.toLowerCase()
        + '"' + 'data-name="' + elem.name
        + '"' + 'data-points="' + elem.championPoints
        + '"' + 'data-chest="' + elem.chestGranted
        + '"' + 'data-letter="' + GRADESMIX[elem.highestGrade];
        toAppend +='">'
        + '<img class="championImage" src="' + elem.urlImage + '">'
        + '<h2>' + elem.name + '</h2>'
        + '<h3>Mastery Level<strong> ' + elem.championLevel + '</strong></h3>';

    var tmp = '<div class="insideBox">' + '<h3><strong>' + elem.championPoints + '</strong> Total Points</h3>';
        tmp += elem.championPointsUntilNextLevel > 0 ? 'Next level in: <strong>' + elem.championPointsUntilNextLevel + '</strong>' : '<strong>Maximum level reached</strong>';
        tmp += elem.chestGranted ? '</br>Chest granted: <strong>Yes</strong>' : '</br>Chest granted: <strong>No</strong>';
        tmp += elem.highestGrade != undefined ? '</br>Highest grade this season: <strong>' + elem.highestGrade + '</strong>' : '</br><strong>No grade yet</strong>';
        tmp += '</div>';

    toAppend += tmp + '</div>';

    $("#Display").append(toAppend);
}

// function used to catch the event "info sent" sent from the server with the data and information to be displayed by the client
socket.on("info sent", function(data) {
    $('.head').css("display", "block");
    $('#Display').html("");
    data.champMasteries.forEach(displayChampInfos);
    $('#Display').mixItUp();
    $('button').show();
    $('input').show();
    $("#welcome").animate({
        opacity: 0,
    }, 500, function () {
        $("#welcome").css("display", "none");
    });
    $(".summoner").append('<img class="summoner-icon" src="'+data.infos.icon+'"><div class="summoner-infos">' + data.infos.name + '</br>Level ' + data.infos.level + '</br>' + data.infos.region.toUpperCase() + '</div>');
});

$(document).ready(function() {

    $("button.buttons").click(function() {
        if (!$(this).hasClass("details")) {
            $("input.byname").val("");
            $(".hidden").removeClass("hidden");
        }
    });

    $("button.grades-ascending").click(function() {
        $('#Display').mixItUp('sort', 'letter:desc points:asc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });
    $("button.grades-descending").click(function() {
        $('#Display').mixItUp('sort', 'letter:asc points:desc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });

    $("button.details").click(function() {
        $(".insideBox").toggle(350);
        $(this).children("span").toggleClass("glyphicon-unchecked");
        $(this).children("span").toggleClass("glyphicon-check");
    });

    $("button.chest-granted").click(function() {
        $('#Display').mixItUp('sort', 'chest:asc points:asc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });
    $("button.chest-not-granted").click(function() {
        $('#Display').mixItUp('sort', 'chest:desc points:desc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });

    $("button.a-to-z").click(function() {
        $('#Display').mixItUp('sort', 'name:desc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });
    $("button.z-to-a").click(function() {
        $('#Display').mixItUp('sort', 'name:asc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });


    $("button.points-ascending").click(function() {
        $('#Display').mixItUp('sort', 'points:asc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });
    $("button.points-descending").click(function() {
        $('#Display').mixItUp('sort', 'points:desc');
        $(".current").toggleClass("current");
        $(this).toggleClass("current");
    });

    $("input.byname").on("keyup", function() {
        var name = $(this).val();
        if (name.length != 0) {
            if (name.length > 0) {
                $('div.champion').addClass("hidden");
            }
            $("div[class*='name-" + name + "']").removeClass("hidden");
        }
        else {
            $("div.champion").removeClass("hidden");
        }
    });

});