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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMarketData = void 0;
const client_1 = require("./client");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const producer = client_1.kafka.producer();
const fetchMarketData = (symbol) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.API_KEY}`;
    const response = yield axios_1.default.get(url);
    return response.data;
});
const publishMarketData = () => __awaiter(void 0, void 0, void 0, function* () {
    yield producer.connect();
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield fetchMarketData("AAPL");
        yield producer.send({
            topic: "market-data",
            messages: [{ value: JSON.stringify(data) }],
        });
        console.log("Published market data");
    }), 1000);
});
exports.publishMarketData = publishMarketData;
// publishMarketData();
