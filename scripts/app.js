import { Client } from "@notionhq/client";

// import Image from './image.png'
import fs from "fs/promises"; // Use promises-based fs for async operations
import fetch from "node-fetch";

const notion = new Client({
  auth: "secret_8rYWtwVTnvEiOIxVPxSoMY8fOG7wjoR0kxDFzurKgVm",
});

const journalingPageId = "23f79fc92f6040f18565979d9561271e";
const habitTrackerPageId = "4694cf795ee846d88bed31bd05f0f0f9";

const currentDate = new Date();
// const isoDate = currentDate.toISOString();
const isoDate = "2024-01-01T15:49:00.000Z";
// console.log(isoDate);

async function getTodayPageId() {
  const response = await notion.databases.query({
    database_id: journalingPageId,
    filter: {
      property: "Date",
      date: {
        // equals: isoDate,
        past_week: {},
      },
    },
  });
  // console.log("Page ID: " + response.results[0].id);
  return response.results[0].id;
}

async function updatePageName() {
  const todayPageId = await getTodayPageId();

  const currentDate = new Date();
  const formattedDate = Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  }).format(currentDate);

  const response = await notion.pages.update({
    page_id: todayPageId,
    properties: {
      title: [
        {
          type: "text",
          text: {
            content: formattedDate,
          },
        },
      ],
    },
  });

  return response;
}

async function uploadPicture() {
  const imageFilePath = "./image.png";

  try {
    const fileData = await fs.readFile(imageFilePath);
    const base64Image = fileData.toString("base64");

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Client-ID 275f0d63f8bcc91`,
      },
      body: JSON.stringify({
        image: base64Image,
        title: currentDate,
      }),
    });

    const responseData = await response.json();
    if (response.ok) {
      console.log("Image Link: " + responseData.data.link);
      return responseData.data.link;
    } else {
      throw new Error(`Image upload failed: ${responseData.data.error}`);
    }
  } catch (error) {
    console.error("Error reading or uploading the image:", error.message);
    throw error;
  }
}

async function addPicture() {
  try {
    const pageId = await getTodayPageId();
    const imageURL = await uploadPicture();

    const response = await notion.pages.update({
      page_id: pageId,
      properties: {
        // Add the picture to the page
        Picture: [
          {
            name: "Photo of the day",
            external: {
              url: imageURL,
            },
          },
        ],
      },
    });

    console.log(response);
  } catch (error) {
    console.error("Error adding picture to the Notion page:", error.message);
  }
}

async function getHabitsPageId() {
  const response = await notion.databases.query({
    database_id: habitTrackerPageId,
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });
  return response.results[0].id;
}

async function getHabitsList() {
  const response = await notion.databases.query({
    database_id: habitTrackerPageId,
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });
  let responseData = response.results[0].properties;
  let habitsList = [];
  for (let key in responseData) {
    if (!(key == "Date" || key == "Name")) {
      if (responseData[key]["checkbox"] == false) {
        habitsList.push(key);
      }
    }
  }
  return habitsList;
}

async function addHabit(habit) {
  const pageId = await getHabitsPageId();
  const properties = {};
  properties[habit] = {
    checkbox: true,
  };
  const response = await notion.pages.update({
    page_id: pageId,
    properties: properties,
  });
  console.log(response);
}
