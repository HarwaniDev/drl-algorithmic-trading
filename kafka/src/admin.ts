import { kafka } from './client';

export async function init() {
  const admin = kafka.admin();
  console.log("Connect to the admin");
  await admin.connect();
  console.log("Admin connection success");

  console.log("Creating topic [market-data]");
  await admin.createTopics({
    topics: [
      {
        topic: "market-data",
        numPartitions: 2,
      },
    ],
  });
  console.log("Topic successfully created: [market-data]");

  console.log("Disconnecting the admin");
  await admin.disconnect();
}
