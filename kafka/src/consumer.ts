import { kafka } from "./client";

const consumer = kafka.consumer({ groupId: "trading-model" });

export const consumeMarketData = async () => {
  await consumer.connect();

  // Subscribe before running the consumer
  await consumer.subscribe({ topic: "market-data", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // Type the `message` argument properly
      const marketData = JSON.parse(message.value?.toString() || "{}");

      console.log("Market Data:", marketData);
    },
  });
};

// consumeMarketData();
