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
exports.init = init;
const client_1 = require("./client");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = client_1.kafka.admin();
        console.log("Connect to the admin");
        yield admin.connect();
        console.log("Admin connection success");
        console.log("Creating topic [market-data]");
        yield admin.createTopics({
            topics: [
                {
                    topic: "market-data",
                    numPartitions: 2,
                },
            ],
        });
        console.log("Topic successfully created: [market-data]");
        console.log("Disconnecting the admin");
        yield admin.disconnect();
    });
}
