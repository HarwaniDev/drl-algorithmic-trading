"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafka = void 0;
const kafkajs_1 = require("kafkajs");
exports.kafka = new kafkajs_1.Kafka({
    brokers: ['192.168.56.1:9092'],
    clientId: "real-time-stock-prediction",
});
