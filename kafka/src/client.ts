import { Kafka } from "kafkajs";

export const kafka = new Kafka({
    brokers: ['192.168.56.1:9092'],
    clientId: "real-time-stock-prediction",
});
