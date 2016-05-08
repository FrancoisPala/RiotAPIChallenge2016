/**
 * Created by Jam on 03-May-16.
 */
var socket = io();
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
    }

    if (summName && region) {
        console.log(summName + region);
        socket.emit("client info", summName + "," + region);
    }
    else {
        $('#subBut').css("display", "block");
    }
    return false;
}

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


function displayChampInfos(elem, index, array) {
    var toAppend = '<div class=" mix category-42 champion col-md-3 name-' + elem.name.toLowerCase()
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

socket.on("info sent", function (data) {
    $('.head').css("display", "block");

    $('#Display').html("");
    console.log(data.length);
    console.log(data[0]);
    data.forEach(displayChampInfos);
    $('#Display').mixItUp();
    $('button.points-ascending').show();
    $('button.chest-granted').show();
    $('button.a-to-z').show();
    $('button.details').show();
    $('button.grades-ascending').show();
    $('input').show();
    $("#welcome").animate({
        opacity: 0,
    }, 500, function () {
        $("#welcome").css("display", "none");
    });
});

$(document).ready(function() {
    $("button.grades-ascending").click(function() {
        $('#Display').mixItUp('sort', 'letter:desc points:asc');

        $(this).hide();
        $('button.grades-descending').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.points-ascending').show();
        $('button.points-descending').hide();

    });
    $("button.grades-descending").click(function() {
        $('#Display').mixItUp('sort', 'letter:asc points:desc');

        $(this).hide();
        $('button.grades-ascending').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.points-ascending').show();
        $('button.points-descending').hide();

    });


    $("button.details").click(function() {
        var selector = document.querySelectorAll(".insideBox");
        for (var i = 0; i < selector.length; ++i){
            selector[i].style.display = 'block';
        }
        $(this).hide();
        $("button.no-details").show();
    });
    $("button.no-details").click(function() {
        var selector = document.querySelectorAll(".insideBox");
        for (var i = 0; i < selector.length; ++i){
            selector[i].style.display = 'none';
        }
        $(this).hide();
        $("button.details").show();
    });


    $("button.chest-granted").click(function() {
        $('#Display').mixItUp('sort', 'chest:asc points:asc');

        $(this).hide();
        $('button.chest-not-granted').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.points-ascending').show();
        $('button.points-descending').hide();


    });
    $("button.chest-not-granted").click(function() {
        $('#Display').mixItUp('sort', 'chest:desc points:desc');

        $(this).hide();
        $('button.chest-granted').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.points-ascending').show();
        $('button.points-descending').hide();

    });

    $("button.a-to-z").click(function() {
        $('#Display').mixItUp('sort', 'name:desc');

        $(this).hide();
        $('button.z-to-a').show();

        $('button.chest-not-granted').hide();
        $('button.chest-granted').show();

        $('button.points-ascending').show();
        $('button.points-descending').hide();


    });
    $("button.z-to-a").click(function() {
        $('#Display').mixItUp('sort', 'name:asc');

        $(this).hide();
        $('button.a-to-z').show();

        $('button.chest-not-granted').hide();
        $('button.chest-granted').show();

        $('button.points-ascending').show();
        $('button.points-descending').hide();


    });


    $("button.points-ascending").click(function() {
        console.log("ascending");
        $('#Display').mixItUp('multiMix', {
            filter: '.category-42',
            sort: 'points:asc'
        });
        //$('#Display').mixItUp('filter', '.category-42');
        //$('#Display').mixItUp('sort', 'points:asc');

        //$(".category-42").mixItUp('sort', 'points:asc');
        //$('#Display').mixItUp('filter', '.category-42');

        $(this).hide();
        $('button.points-descending').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.chest-not-granted').hide();
        $('button.chest-granted').show();
    });

    $("button.points-descending").click(function() {
        console.log("descending");
        //$('#Display').mixItUp('filter', '.category-42');
        //$('#Display').mixItUp('sort', 'points:desc');
        $('#Display').mixItUp('multiMix', {
            filter: '.category-42',
            sort: 'points:desc'
        });
        //$('#Display').mixItUp('filter', '.category-42');

        //$('.category-42').mixItUp('sort', 'points:desc');
        $(this).hide();
        $('button.points-ascending').show();

        $('button.a-to-z').show();
        $('button.z-to-a').hide();

        $('button.chest-not-granted').hide();
        $('button.chest-granted').show();
    });

    //$('#Display').on('mixEnd', function(e, state){
    //    var name = $("input.byname").val();
    //    if (name.length > 0) {
    //        $('div.champion').hide();
    //    }
    //    $("div[class*='name-" + name + "']").fadeIn();
    //});

    $("input.byname").on("keyup", function() {
        var name = $(this).val();
        if (name.length > 0) {
            console.log("on hide");
            $('div.champion').hide();
            $('div.champion').toggleClass('category-42');
        }
        console.log("on fade in");
        $("div[class*='name-" + name + "']").fadeIn();
        $("div[class*='name-" + name + "']").toggleClass("category-42");
        //$('#Display').mixItUp('filter', '.category-42');

    });

});