require("dotenv").config();
require("isomorphic-unfetch");
const { promises: fs } = require("fs");
const path = require("path");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

async function main() {
    const readmeTemplate = (
        await fs.readFile(path.join(process.cwd(), "./README.template.md"))
    ).toString("utf-8");

    const { access_token } = await (
        await fetch(
            `https://accounts.spotify.com/api/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}`,
            {
            headers: {
                "content-type": "application/x-www-form-urlencoded ",
            },
            method: "POST",
            }
        )
    ).json();

    console.log(access_token)

    // default values if nothing is playing rn
    var img = "./gray_sq.jpg";
    var artist_list = "";
    var song_name = "Nothing playing right now...";

    await (
        await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
    ).json()
    .then(curr_track => {
        console.log(curr_track);

        // get list of artists
        var artist_list = ""
        const json_artists = curr_track.item.artists;
        for (var i = 0; i < json_artists.length; i++) {
            artist_list += json_artists[i].name + ", ";
        }
        artist_list = artist_list.slice(0, -2);     // remove last ", "
        //artist_list = "by **" + artist_list + "**"; // add on by and ** for bold for README formatting

        const readme = readmeTemplate
            .replace("{sp_img}", curr_track.item.album.images[0].url)
            .replace("{sp_name}", curr_track.item.name)
            .replace("{sp_artist}", artist_list)
            .replace("{sp_link}", curr_track.item.external_urls.spotify);

        fs.writeFile("README.md", readme);
    })
    .catch(error => {
        console.log("No response");

        const readme = readmeTemplate
            .replace("{sp_img}", "./gray_sq.jpg")
            .replace("{sp_name}", "Nothing playing right now...")
            .replace("{sp_artist}", "")
            .replace("{sp_link}", "");

        fs.writeFile("README.md", readme);
    });
}

main();