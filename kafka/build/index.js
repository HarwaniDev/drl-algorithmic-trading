"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("./admin");
const producer_1 = require("./producer");
const consumer_1 = require("./consumer");
const runApp = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Initialize Kafka admin (this will create the topic if it doesn't exist)
        yield (0, admin_1.init)();
        // Start the Kafka producer to fetch and publish market data every minute
        (0, producer_1.publishMarketData)();
        // Start the Kafka consumer to listen and process the published market data
        (0, consumer_1.consumeMarketData)();
    }
    catch (error) {
        console.error("Error in running the application:", error);
    }
});
runApp();
