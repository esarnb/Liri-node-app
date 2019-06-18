require("dotenv").config();

/*
    Packages
*/

var fs = require("fs");
var axios = require("axios");
var moment = require("moment");
var Spotify = require("node-spotify-api");

/*
    Global Variables
*/

var keys = require("./keys.js")
var spotify = new Spotify(keys.spotify)

/*
    Functions
*/

/**
 * 
 * @param {Array} unedited is the unedited process.argv list used to gather user input.
 * 
 * The function takes in the array, slices out the node-location and file-executed-location
 * and converts all inputted numbers into floats, then returns the final array.
 * (Floats are unnecessary for this project, so that loop is commented out).
 * 
 * The purpose of the function is to easily parse through the process.argv to use user inputs.
 */
function convertProcess(unedited) { 
    var args = unedited.slice(2); 
    // for (var i = 0; i < args.length; i++) { 
    //     if (!isNaN(args[i])) { 
    //         args[i] = parseFloat(args[i]); 
    //         /*console.log(args[i])*/ 
    //     }
    // }; 
    return args; 
}

/**
 * 
 * @param {String} artist is the artist or band the user inputs.
 * 
 * Function makes an api call to bandsintown, appends all info available to a string, then logs the string to console and txt file.
 * 
 */
function concertThis(artist) {
    axios.get("https://rest.bandsintown.com/artists/" + artist + "/events?app_id=codingbootcamp").then((response) => {
        console.log("----------------------------------------------------------------");
        var finalAnswer = "";
        for (resp of response.data) {
            var theLocation = "";
            var theVenue = resp.venue.name;
            var theDate = moment(resp.datetime).format("LLLL");

            //If one of these exist, add it to the location string
            resp.venue.region ? theLocation += `Region: ${resp.venue.region}\n` : null
            resp.venue.country ? theLocation += `Country: ${resp.venue.country}\n` : null
            resp.venue.city ? theLocation += `City: ${resp.venue.city}\n` : null
            finalAnswer += `\n\nVenue: ${theVenue}\n${theLocation}Date: ${theDate}`;
            console.log(finalAnswer)
        }
        logTxt("concert-this", finalAnswer)
    })
}

/**
 * 
 * @param {String} song  is the song inputted by the user to search on spotify.
 * 
 * Function makes an api call to spotify, appends all info available to a string, then logs the string to console and txt file.  
 */
function spotifyThis(song) {
    song ? null : song = "The Sign" //"The Sign" by Ace of Base
    spotify.search({ type: 'track', query: song }, function(err, data) {
        if (err) return console.log(err);
        console.log("----------------------------------------------------------------");
        console.log();//spacer
        var finalAnswer = "";
        for (var i = 0; i < data.tracks.items.length; i++) {
            var name = data.tracks.items[i].name
            var album = data.tracks.items[i].album.name;
            var preview = data.tracks.items[i].preview_url;
            var artists = data.tracks.items[i].album.artists[0].name
            
            //If any of these exist, add it to the response;
            var resp = "";
            name ? resp+=`Song: ${name}\n`:null;
            artists ? resp += `Artist(s): ${artists}\n`:null;
            album ? resp+=`Album: ${album}\n`:null;
            preview ? resp+=`Link: ${preview}\n`:null;
            console.log(resp,"\n");
            finalAnswer += (resp+"\n")
        }
        logTxt("spotify-this-song", finalAnswer)
    });

}

/**
 * 
 * @param {String} title is the movie title the user inputs to be searched on omdb.
 * 
 * Function makes an api call to omdb, appends all info available to a string, then logs the string to console and txt file.  
 */
function movieThis(title) {
    title ? null : title = "Mr. Nobody" //If no title, use "Mr. Nobody"
    var queryURL = "https://www.omdbapi.com/?t=" + title + "&y=&plot=short&apikey=trilogy";
    axios.get(queryURL).then(function(response) {
        console.log("----------------------------------------------------------------");  
        var resp = "";
        var plot = response.data.Plot;
        var title = response.data.Title;
        var actors = response.data.Actors;
        var country = response.data.Country;
        var language = response.data.Language;
        var released = response.data.Released;
        var imdbRating = response.data.imdbRating
        var rating = response.data.Ratings.find(obj => obj.Source === "Rotten Tomatoes").Value;

        //Conditionals to check for validity on each property asked for; concat all available info.
        title ? resp+= `Title: ${title}\n` : null;
        released ? resp+= `Released: ${released}\n` : null;
        imdbRating ? resp+= `IMDB Rating: ${imdbRating}\n` : null;
        rating ? resp+= `Rotten Tomato Rating: ${rating}\n` : null;
        country ? resp+= `Country: ${country}\n` : null;
        language ? resp+= `Language: ${language}\n` : null;
        actors ? resp+= `Actors: ${actors}\n` : null;
        plot ? resp+= `\nPlot: ${plot}\n` : null;
        console.log();//Spacer        
        console.log(resp);
        logTxt("movie-this", resp)
    })
}

/**
 * 
 * @param {String} cmd is the executed command the user put as the first argument.
 * @param {String} data is the response based on the executed command; each function has one response string.
 */
function logTxt(cmd, data) {
    var logData = {
        timestamp: moment().format("LLLL"),
        command: cmd,
        data: data 
    }
    fs.appendFile("log.txt", JSON.stringify(logData) , function(err) {
        if (err) return console.log(err);
    })
}

/*
     Work Done
 */
var args = convertProcess(process.argv);
if (!args[0]) return console.log("You need to specify an action!");

// console.clear(); //Clears console for better readability

//Reads in first input, given by user.
runCmds(args[0], args.slice(1, args.length).join(" "))

/**
 * 
 * @param {String} input is the command ran by user or by the random.txt file.
 * @param {String} value is the value to be inserted to one of the functions to search with.
 * 
 * Function uses a switch case on the command to pick which api to use. 
 * If the do-what-it-says is chosen, then all available commands in the random.txt file is ran one by one.
 */
function runCmds(input, value){
    switch(input) {

        case "concert-this":
            if (!value) return console.log("You need to specify a band!");
            else {
                concertThis(value);
            }
        break;

        case "spotify-this-song":
            //if no args => default to 'The Sign'
            spotifyThis(value)
        break;

        case "movie-this": 
            //if no args => default to "Mr.Nobody"
            movieThis(value)
        break;

        case "do-what-it-says":
            fs.readFile("random.txt", "utf8", function(err, response) {
                if (err) return console.log(err);
                var perCmd = response.split(" | ");

                //Literally the only way this recursion can work is if there no quotes, afaik.
                //It tries to search with quotes which errors concert-this. 
                var list = perCmd.map(x => x.replace('"',"").replace('"',"").split(","));
                for(each of list) {
                    runCmds(each[0], each[1])
                }
            })
        break;

        default: console.log("Could not understand the action.");
        break;
    }
}