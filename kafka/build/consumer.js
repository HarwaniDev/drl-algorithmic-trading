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
exports.consumeMarketData = void 0;
const client_1 = require("./client");
const consumer = client_1.kafka.consumer({ groupId: "trading-model" });
const consumeMarketData = () => __awaiter(void 0, void 0, void 0, function* () {
    yield consumer.connect();
    // Subscribe before running the consumer
    yield consumer.subscribe({ topic: "market-data", fromBeginning: true });
    yield consumer.run({
        eachMessage: (_a) => __awaiter(void 0, [_a], void 0, function* ({ topic, partition, message }) {
            var _b;
            // Type the `message` argument properly
            const marketData = JSON.parse(((_b = message.value) === null || _b === void 0 ? void 0 : _b.toString()) || "{}");
            console.log("Market Data:", marketData);
        }),
    });
});
exports.consumeMarketData = consumeMarketData;
// consumeMarketData();
