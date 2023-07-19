import { Client } from "@notionhq/client"

// import Image from './image.png'
import fs from 'fs';
import fetch from 'node-fetch';

const notion = new Client({ auth: "secret_8rYWtwVTnvEiOIxVPxSoMY8fOG7wjoR0kxDFzurKgVm" })

const journalingPageId = "e48fb3df690b48d98f9550bb5d182a89"
const habitTrackerPageId = "7666196a0c9f4241ac5c1f19a2443fee"

const currentDate = new Date();
const isoDate = "2023-07-14T22:00:00.000Z" //currentDate.toISOString();


async function getTodayPageId() {
  const response = await notion.databases.query({
    database_id: journalingPageId,
    filter: {
      property: 'التاريخ',
      date: {
        equals: isoDate,
        // past_week: {}
      },
    }
  });
  console.log("Page ID: " + response.results[0].id);
  return response.results[0].id;
};


async function uploadPicture() {
  const imageFilePath = './image.png';

  try {
    const fileData = fs.readFileSync(imageFilePath);
    const base64Image = fileData.toString('base64');

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Client-ID 275f0d63f8bcc91`,
      },
      body: JSON.stringify({
        image: base64Image,
        title: currentDate
      }),
    });

    const responseData = await response.json();
    // console.log(responseData);
    console.log("Image Link: " + responseData.data.link)
    return responseData.data.link
  } catch (error) {
    console.error('Error reading or uploading the image:', error);
  }
};


async function addPicture() {
  const pageId = await getTodayPageId();
  const imageURL = await uploadPicture();
  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      // Update title to mention today
      title: [
        {
          mention: {
            type: "date",
            date: {
              start: new Date().toISOString().split("T")[0],
            },
          },
        },
      ],
      // Add the picture to the page
      "صورة اليوم": [
        {
          "name": "Photo of the day",
          "external": {
            "url": imageURL
          }
        }
      ],
    }
  })
  console.log(response)
};


async function getHabitsPageId() {
  const response = await notion.databases.query({
    database_id: habitTrackerPageId,
    "sorts": [
      {
        "property": "التاريخ",
        "direction": "descending"
      }
    ],
  });
  return response.results[0].id
}


async function getHabitsList() {
  const response = await notion.databases.query({
    database_id: habitTrackerPageId,
    "sorts": [
      {
        "property": "التاريخ",
        "direction": "descending"
      }
    ],
  });
  let responseData = response.results[0].properties
  let habitsList = []
  for (let key in responseData) {
    if (!(key == 'التاريخ' || key == 'Name')) {
      if (responseData[key]['checkbox'] == false) {
        habitsList.push(key)
      }
    }
  }
  return habitsList
}


async function addHabit(habit) {
  const pageId = await getHabitsPageId();
  const properties = {};
  properties[habit] = {
    checkbox: true
  };
  const response = await notion.pages.update({
    page_id: pageId,
    properties: properties
  })
  console.log(response)
}