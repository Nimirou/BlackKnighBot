const axios = require("axios");
const dotenv = require("dotenv").config();
const cheerio = require("cheerio");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let sOldValueCount = 0,
  aNewValues = [],
  aOldValues = [],
  sNewValueCount,
  MainChannel;

/**
 * When bot connects to Discord and fetch specific channel it returns channel and start the scrapping loop
 */
client.on("ready", () => {
  client.channels.fetch("1055590070448574516").then((channel) => {
    MainChannel = channel;
    callCycle(MainChannel);
  });
});

/**
 *Creates String from array every element of array is on different line can be also used array.join() function
 *
 * @param {Array} array - array of strings
 * @return {String}
 */
function createStringFromArray(array) {
  let sConnectedArray = "";
  array.forEach((element) => {
    sConnectedArray += element.toString() + "\n";
  });
  return sConnectedArray;
}

/**
 * Calls axios for getting HTML content
 *
 * @param {*} options - options as URL and coding
 * @return {*} - return values of scraping
 */
function callAxios(options) {
  return axios(options).then((response) => {
    const html = decodeURIComponent(response.data.toString("binary"));
    const $ = cheerio.load(html);
    var sValue = $(".obchodnadpis").text();
    return sValue;
  });
}

/**
 *Function called after all axios callbacks have finished. Function sends message to server and printing differences in old and new values
 */
function afterAllAxiosCompleted() {
  var Message = `**Na Černém rytíři se změnil počet produktů. Starý počet - ${sOldValueCount} , Nový počet - ${sNewValueCount}** \n -------------------------------------------------- \n`;

  let differenceOld = aNewValues.filter((x) => !aOldValues.includes(x));
  if (differenceOld.length > 0) {
    if (differenceOld.length < 15) {
      Message +=
        "Věci byli přidány -\n" +
        createStringFromArray(differenceOld) +
        " -------------------------------------------------- \n";
    }
  }
  let differenceNew = aOldValues.filter((x) => !aNewValues.includes(x));
  if (differenceNew.length > 0) {
    if (differenceNew.length < 15) {
      Message +=
        "Věci byli odebrány -\n" +
        createStringFromArray(differenceNew) +
        " -------------------------------------------------- \n";
    }
  }
  sOldValueCount = sNewValueCount;
  OldValue = aNewValues;

  aNewValues = [];
  sNewValueCount = "";
  MainChannel.send(`<@351055918735032321> ${Message}`);
  setTimeout(function () {
    callCycle(MainChannel);
  }, 300000); //300000
}

/**
 *Function that return Urls we want to scrap
 *
 * @return {Array} - of Urls we want to scrap also with section name
 */
function getUrls() {
  return [
    {
      url: "https://cernyrytir.cz/index.php3?akce=100&sekce=pok",
      sekce: "PokemonČR",
    },
    {
      url: "https://cernyrytir.cz/index.php3?akce=100&limit=40&sekce=pok&submit=Vyhledej",
      sekce: "PokemonČR1",
    },
    {
      url: "https://cernyrytir.cz/index.php3?akce=100&limit=80&sekce=pok&submit=Vyhledej",
      sekce: "PokemonČR2",
    },
    {
      url: "https://cernyrytir.cz/index.php3?akce=100&limit=120&sekce=pok&submit=Vyhledej",
      sekce: "PokemonČR3",
    },
    {
      url: "https://cernyrytir.cz/index.php3?akce=100&limit=160&sekce=pok&submit=Vyhledej",
      sekce: "PokemonČR4",
    },
  ];
}

/**
 *Main cycle function, called when bot is ready and repeated every x minutes. It scrapp basic count of products and if it not equal (something changed) it scrap all products. If nothing changed it just timeout and start again
 *
 */
function callCycle() {
  let options = {
    method: "GET",
    responseType: "arraybuffer",
    responseEncoding: "binary",
    url: "",
  };

  const MainOption = {
    method: "GET",
    responseType: "arraybuffer",
    responseEncoding: "binary",
    url: "https://cernyrytir.cz/index.php3?akce=100&sekce=pok",
  };

  axios(MainOption).then((response) => {
    const html = decodeURIComponent(response.data.toString("binary"));
    const $ = cheerio.load(html);
    var hodnoty = $(".kusovkytext").text();
    sNewValueCount = hodnoty.split(" ")[1];
    if (sNewValueCount !== sOldValueCount) {
      let allAxios = [];
      for (let i = 0; i < getUrls().length; i++) {
        options.url = getUrls()[i].url;
        allAxios.push(callAxios(options, i));
      }
      Promise.all(allAxios).then((values) => {
        for (i = 0; i < values.length; i++) {
          values[i].split("Kè").forEach((element) => {
            if (element !== "") {
              aNewValues.push(element.split("\n")[0]);
            }
          });
        }
        afterAllAxiosCompleted();
      });
    } else {
      setTimeout(function () {
        callCycle(MainChannel);
      }, 300000);
    }
  });
}

client.login(process.env.TOKEN);
