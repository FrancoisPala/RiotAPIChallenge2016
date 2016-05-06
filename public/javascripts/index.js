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
    $("#Container").append('<div class=" mix '+ 'champion-'+elem.name +' '+ 'points-'+elem.championPoints +'">' + elem.name + '\nPoints: ' + elem.championPoints + '</div>');
}

socket.on("info sent", function (data) {
    
    console.log("received this: " + data);
    console.log(data.length);
    console.log(data[0]);
    data.forEach(displayChampInfos);
    
    //$("#Container").append('');
    
    $("#welcome").animate({
        opacity: 0,
    }, 1000, function () {
        $("#welcome").css("display", "none");
    });
});