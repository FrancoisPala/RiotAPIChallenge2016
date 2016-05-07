/**
 * Created by Jam on 03-May-16.
 */
var socket = io();
function validate() {
    var summName = document.forms["form"]["summName"].value;
    var region = document.forms["form"]["regions"].value;
    console.log(summName + region);
    socket.emit("client info", summName + "," + region);
    return false;
}

function displayChampInfos(elem, index, array) {
    $("#Container").append('<div class=" mix category-42 champion col-md-3 name-' + elem.name.toLowerCase() + '"'+ 'data-name="' + elem.name + '"' + 'data-points="' + elem.championPoints +'">'
        + '<img class="championImage" src="' + elem.urlImage + '">'
        + '<h2>' + elem.name + '</h2>'
        + '<h3>Mastery Level<strong> ' + elem.championLevel + '</strong></h3>'
        + '</br>Total Points: <strong>' + elem.championPoints + '</strong>'
        + '</br>Next level in: <strong>' + elem.championPointsUntilNextLevel + '</strong>'
        + '</br>Current level: <strong>' + elem.championLevel + '</strong>'
        + '</br>Next level in: <strong>' + elem.championPointsUntilNextLevel + '</strong>'
        + '</br>Chest granted: <strong>' + elem.chestGranted + '</strong>'
        + '</br>Highest grade this season: <strong>' + elem.highestGrade + '</strong>'
        +
        '</div>');
}

socket.on("info sent", function (data) {
    
    console.log(data.length);
    console.log(data[0]);
    data.forEach(displayChampInfos);
    $('#Container').mixItUp();
    $('button.points-ascending').show();
    $("#welcome").animate({
        opacity: 0,
    }, 500, function () {
        $("#welcome").css("display", "none");
    });
});

$(document).ready(function() {
    $("button.points-ascending").click(function() {
        console.log("ascending");
        $('#Container').mixItUp('multiMix', {
            filter: '.category-42',
            sort: 'points:asc'
        });
        //$('#Container').mixItUp('filter', '.category-42');
        //$('#Container').mixItUp('sort', 'points:asc');

        //$(".category-42").mixItUp('sort', 'points:asc');
        //$('#Container').mixItUp('filter', '.category-42');

        $(this).hide();
        $('button.points-descending').show();
    });

    $("button.points-descending").click(function() {
        console.log("descending");
        //$('#Container').mixItUp('filter', '.category-42');
        //$('#Container').mixItUp('sort', 'points:desc');
        $('#Container').mixItUp('multiMix', {
            filter: '.category-42',
            sort: 'points:desc'
        });
        //$('#Container').mixItUp('filter', '.category-42');

        //$('.category-42').mixItUp('sort', 'points:desc');
        $(this).hide();
        $('button.points-ascending').show();
    });

    //$('#Container').on('mixEnd', function(e, state){
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
        //$('#Container').mixItUp('filter', '.category-42');

    });

});