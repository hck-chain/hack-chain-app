declare const BuildOfferV2: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly offerer: {
                readonly type: "string";
            };
            readonly quantity: {
                readonly type: "integer";
                readonly format: "int32";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly criteria: {
                readonly type: "object";
                readonly properties: {
                    readonly collection: {
                        readonly type: "object";
                        readonly properties: {
                            readonly slug: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["slug"];
                    };
                    readonly trait: {
                        readonly deprecated: true;
                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                        readonly type: "object";
                        readonly properties: {
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["type", "value"];
                    };
                    readonly traits: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["type", "value"];
                        };
                    };
                };
                readonly required: readonly ["collection"];
            };
            readonly protocol_address: {
                readonly type: "string";
            };
            readonly offer_protection_enabled: {
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["criteria", "offer_protection_enabled", "offerer", "protocol_address", "quantity"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly partialParameters: {
                    readonly type: "object";
                    readonly properties: {
                        readonly consideration: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly itemType: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly token: {
                                        readonly type: "string";
                                    };
                                    readonly identifierOrCriteria: {
                                        readonly type: "string";
                                    };
                                    readonly startAmount: {
                                        readonly type: "string";
                                    };
                                    readonly endAmount: {
                                        readonly type: "string";
                                    };
                                    readonly recipient: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                            };
                        };
                        readonly zone: {
                            readonly type: "string";
                        };
                        readonly zoneHash: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["consideration", "zone", "zoneHash"];
                };
                readonly encodedTokenIds: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["partialParameters"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CancelOrder1: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly offererSignature: {
                readonly type: "string";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly order_hash: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["chain", "protocol_address", "order_hash"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "X-Api-Key": {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly last_signature_issued_valid_until: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["last_signature_issued_valid_until"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GenerateListingFulfillmentDataV21: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly listing: {
                readonly type: "object";
                readonly properties: {
                    readonly hash: {
                        readonly type: "string";
                    };
                    readonly chain: {
                        readonly type: "string";
                    };
                    readonly protocol_address: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["chain", "hash", "protocol_address"];
            };
            readonly fulfiller: {
                readonly type: "object";
                readonly properties: {
                    readonly address: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["address"];
            };
            readonly consideration: {
                readonly type: "object";
                readonly properties: {
                    readonly asset_contract_address: {
                        readonly type: "string";
                    };
                    readonly token_id: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["asset_contract_address", "token_id"];
            };
            readonly recipient: {
                readonly type: "string";
            };
            readonly units_to_fill: {
                readonly type: "integer";
                readonly format: "int64";
                readonly description: "Optional quantity of units to fulfill; defaults to remaining units for listings";
                readonly minimum: -9223372036854776000;
                readonly maximum: 9223372036854776000;
            };
            readonly include_optional_creator_fees: {
                readonly type: "boolean";
                readonly default: "false";
                readonly description: "Whether to include optional creator fees in the fulfillment. If creator fees are already required, this is a no-op. Defaults to false.";
            };
        };
        readonly required: readonly ["fulfiller", "listing"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly protocol: {
                    readonly type: "string";
                };
                readonly fulfillment_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly transaction: {
                            readonly type: "object";
                            readonly properties: {
                                readonly function: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly to: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                                readonly input_data: {
                                    readonly oneOf: readonly [{
                                        readonly required: readonly ["advancedOrder", "criteriaResolvers", "fulfillerConduitKey", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly advancedOrder: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly numerator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly denominator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly extraData: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "criteriaResolvers", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["parameters"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly parameters: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly considerationToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly considerationIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly considerationAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerer: {
                                                        readonly type: "string";
                                                    };
                                                    readonly zone: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly basicOrderType: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly startTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly endTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly zoneHash: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly salt: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offererConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly fulfillerConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly totalOriginalAdditionalRecipients: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly additionalRecipients: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly amount: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly recipient: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillerConduitKey", "order"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly order: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["criteriaResolvers", "fulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    }];
                                };
                            };
                            readonly required: readonly ["chain", "function", "input_data", "to", "value"];
                        };
                        readonly orders: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly offerer: {
                                                readonly type: "string";
                                            };
                                            readonly offer: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                };
                                            };
                                            readonly consideration: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly recipient: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                };
                                            };
                                            readonly startTime: {
                                                readonly type: "string";
                                            };
                                            readonly endTime: {
                                                readonly type: "string";
                                            };
                                            readonly orderType: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly zone: {
                                                readonly type: "string";
                                            };
                                            readonly zoneHash: {
                                                readonly type: "string";
                                            };
                                            readonly salt: {
                                                readonly type: "string";
                                            };
                                            readonly conduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly totalOriginalConsiderationItems: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly counter: {
                                                readonly type: "integer";
                                            };
                                        };
                                        readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zone", "zoneHash"];
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["parameters", "signature"];
                            };
                        };
                    };
                    readonly required: readonly ["orders", "transaction"];
                };
            };
            readonly required: readonly ["fulfillment_data", "protocol"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly protocol: {
                    readonly type: "string";
                };
                readonly fulfillment_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly transaction: {
                            readonly type: "object";
                            readonly properties: {
                                readonly function: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly to: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                                readonly input_data: {
                                    readonly oneOf: readonly [{
                                        readonly required: readonly ["advancedOrder", "criteriaResolvers", "fulfillerConduitKey", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly advancedOrder: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly numerator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly denominator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly extraData: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "criteriaResolvers", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["parameters"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly parameters: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly considerationToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly considerationIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly considerationAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerer: {
                                                        readonly type: "string";
                                                    };
                                                    readonly zone: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly basicOrderType: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly startTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly endTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly zoneHash: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly salt: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offererConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly fulfillerConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly totalOriginalAdditionalRecipients: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly additionalRecipients: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly amount: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly recipient: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillerConduitKey", "order"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly order: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["criteriaResolvers", "fulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    }];
                                };
                            };
                            readonly required: readonly ["chain", "function", "input_data", "to", "value"];
                        };
                        readonly orders: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly offerer: {
                                                readonly type: "string";
                                            };
                                            readonly offer: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                };
                                            };
                                            readonly consideration: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly recipient: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                };
                                            };
                                            readonly startTime: {
                                                readonly type: "string";
                                            };
                                            readonly endTime: {
                                                readonly type: "string";
                                            };
                                            readonly orderType: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly zone: {
                                                readonly type: "string";
                                            };
                                            readonly zoneHash: {
                                                readonly type: "string";
                                            };
                                            readonly salt: {
                                                readonly type: "string";
                                            };
                                            readonly conduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly totalOriginalConsiderationItems: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly counter: {
                                                readonly type: "integer";
                                            };
                                        };
                                        readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zone", "zoneHash"];
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["parameters", "signature"];
                            };
                        };
                    };
                    readonly required: readonly ["orders", "transaction"];
                };
            };
            readonly required: readonly ["fulfillment_data", "protocol"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GenerateOfferFulfillmentDataV2: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly offer: {
                readonly type: "object";
                readonly properties: {
                    readonly hash: {
                        readonly type: "string";
                    };
                    readonly chain: {
                        readonly type: "string";
                    };
                    readonly protocol_address: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["chain", "hash", "protocol_address"];
            };
            readonly fulfiller: {
                readonly type: "object";
                readonly properties: {
                    readonly address: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["address"];
            };
            readonly consideration: {
                readonly type: "object";
                readonly properties: {
                    readonly asset_contract_address: {
                        readonly type: "string";
                    };
                    readonly token_id: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["asset_contract_address", "token_id"];
            };
            readonly units_to_fill: {
                readonly type: "integer";
                readonly format: "int64";
                readonly description: "Optional quantity of units to fulfill; defaults to 1 for offers";
                readonly minimum: -9223372036854776000;
                readonly maximum: 9223372036854776000;
            };
            readonly include_optional_creator_fees: {
                readonly type: "boolean";
                readonly default: "false";
                readonly description: "Whether to include optional creator fees in the fulfillment. If creator fees are already required, this is a no-op. Defaults to false.";
            };
        };
        readonly required: readonly ["fulfiller", "offer"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly protocol: {
                    readonly type: "string";
                };
                readonly fulfillment_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly transaction: {
                            readonly type: "object";
                            readonly properties: {
                                readonly function: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly to: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                                readonly input_data: {
                                    readonly oneOf: readonly [{
                                        readonly required: readonly ["advancedOrder", "criteriaResolvers", "fulfillerConduitKey", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly advancedOrder: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly numerator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly denominator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly extraData: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "criteriaResolvers", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["parameters"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly parameters: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly considerationToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly considerationIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly considerationAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerer: {
                                                        readonly type: "string";
                                                    };
                                                    readonly zone: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly basicOrderType: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly startTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly endTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly zoneHash: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly salt: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offererConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly fulfillerConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly totalOriginalAdditionalRecipients: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly additionalRecipients: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly amount: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly recipient: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillerConduitKey", "order"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly order: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["criteriaResolvers", "fulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    }];
                                };
                            };
                            readonly required: readonly ["chain", "function", "input_data", "to", "value"];
                        };
                        readonly orders: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly offerer: {
                                                readonly type: "string";
                                            };
                                            readonly offer: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                };
                                            };
                                            readonly consideration: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly recipient: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                };
                                            };
                                            readonly startTime: {
                                                readonly type: "string";
                                            };
                                            readonly endTime: {
                                                readonly type: "string";
                                            };
                                            readonly orderType: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly zone: {
                                                readonly type: "string";
                                            };
                                            readonly zoneHash: {
                                                readonly type: "string";
                                            };
                                            readonly salt: {
                                                readonly type: "string";
                                            };
                                            readonly conduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly totalOriginalConsiderationItems: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly counter: {
                                                readonly type: "integer";
                                            };
                                        };
                                        readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zone", "zoneHash"];
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["parameters", "signature"];
                            };
                        };
                    };
                    readonly required: readonly ["orders", "transaction"];
                };
            };
            readonly required: readonly ["fulfillment_data", "protocol"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly protocol: {
                    readonly type: "string";
                };
                readonly fulfillment_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly transaction: {
                            readonly type: "object";
                            readonly properties: {
                                readonly function: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly to: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                                readonly input_data: {
                                    readonly oneOf: readonly [{
                                        readonly required: readonly ["advancedOrder", "criteriaResolvers", "fulfillerConduitKey", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly advancedOrder: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly numerator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly denominator: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly extraData: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "criteriaResolvers", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["considerationFulfillments", "fulfillerConduitKey", "maximumFulfilled", "offerFulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly offerFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly considerationFulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly orderIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly itemIndex: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly maximumFulfilled: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly bitSize: {
                                                        readonly type: "integer";
                                                        readonly format: "int32";
                                                        readonly minimum: -2147483648;
                                                        readonly maximum: 2147483647;
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["parameters"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly parameters: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly considerationToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly considerationIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly considerationAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerer: {
                                                        readonly type: "string";
                                                    };
                                                    readonly zone: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerToken: {
                                                        readonly type: "string";
                                                    };
                                                    readonly offerIdentifier: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offerAmount: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly basicOrderType: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly startTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly endTime: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly zoneHash: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly salt: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly offererConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly fulfillerConduitKey: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly totalOriginalAdditionalRecipients: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly additionalRecipients: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly amount: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly recipient: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillerConduitKey", "order"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly order: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {};
                                                            };
                                                        };
                                                    };
                                                    readonly parameters: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly value: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly typeAsString: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly value: {};
                                                                    };
                                                                };
                                                            };
                                                            readonly offerer: {
                                                                readonly type: "string";
                                                            };
                                                            readonly zone: {
                                                                readonly type: "string";
                                                            };
                                                            readonly offer: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly consideration: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                    readonly properties: {
                                                                        readonly itemType: {
                                                                            readonly type: "integer";
                                                                            readonly format: "int32";
                                                                            readonly minimum: -2147483648;
                                                                            readonly maximum: 2147483647;
                                                                        };
                                                                        readonly token: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly identifierOrCriteria: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly startAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly endAmount: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly recipient: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                            readonly orderType: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly startTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly endTime: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly zoneHash: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly salt: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly conduitKey: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                            readonly totalOriginalConsiderationItems: {
                                                                readonly type: "integer";
                                                            };
                                                            readonly typeAsString: {
                                                                readonly type: "string";
                                                            };
                                                            readonly nativeValueCopy: {
                                                                readonly type: "array";
                                                                readonly items: {};
                                                            };
                                                        };
                                                    };
                                                    readonly signature: {
                                                        readonly type: "string";
                                                        readonly format: "byte";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                    readonly nativeValueCopy: {
                                                        readonly type: "array";
                                                        readonly items: {};
                                                    };
                                                };
                                            };
                                            readonly fulfillerConduitKey: {
                                                readonly type: "string";
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["criteriaResolvers", "fulfillments", "orders", "recipient"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly numerator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly denominator: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly extraData: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly criteriaResolvers: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly orderIndex: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly side: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly index: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly identifier: {
                                                            readonly type: "integer";
                                                        };
                                                        readonly criteriaProof: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                                readonly format: "byte";
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly recipient: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                    readonly typeAsString: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    }, {
                                        readonly required: readonly ["fulfillments", "orders"];
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly orders: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly parameters: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly value: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly properties: {
                                                                            readonly typeAsString: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly value: {};
                                                                        };
                                                                    };
                                                                };
                                                                readonly offerer: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly zone: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly offer: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly consideration: {
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                                        readonly properties: {
                                                                            readonly itemType: {
                                                                                readonly type: "integer";
                                                                                readonly format: "int32";
                                                                                readonly minimum: -2147483648;
                                                                                readonly maximum: 2147483647;
                                                                            };
                                                                            readonly token: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly identifierOrCriteria: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly startAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly endAmount: {
                                                                                readonly type: "string";
                                                                            };
                                                                            readonly recipient: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                };
                                                                readonly orderType: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly startTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly endTime: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly zoneHash: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly salt: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly conduitKey: {
                                                                    readonly type: "string";
                                                                    readonly format: "byte";
                                                                };
                                                                readonly totalOriginalConsiderationItems: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly typeAsString: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly nativeValueCopy: {
                                                                    readonly type: "array";
                                                                    readonly items: {};
                                                                };
                                                            };
                                                        };
                                                        readonly signature: {
                                                            readonly type: "string";
                                                            readonly format: "byte";
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                            readonly fulfillments: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly value: {};
                                                                };
                                                            };
                                                        };
                                                        readonly offerComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly considerationComponents: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly value: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "object";
                                                                            readonly properties: {
                                                                                readonly typeAsString: {
                                                                                    readonly type: "string";
                                                                                };
                                                                                readonly value: {};
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly orderIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly itemIndex: {
                                                                        readonly type: "integer";
                                                                    };
                                                                    readonly typeAsString: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly nativeValueCopy: {
                                                                        readonly type: "array";
                                                                        readonly items: {};
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly typeAsString: {
                                                            readonly type: "string";
                                                        };
                                                        readonly nativeValueCopy: {
                                                            readonly type: "array";
                                                            readonly items: {};
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    }];
                                };
                            };
                            readonly required: readonly ["chain", "function", "input_data", "to", "value"];
                        };
                        readonly orders: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly offerer: {
                                                readonly type: "string";
                                            };
                                            readonly offer: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                                };
                                            };
                                            readonly consideration: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly itemType: {
                                                            readonly type: "integer";
                                                            readonly format: "int32";
                                                            readonly minimum: -2147483648;
                                                            readonly maximum: 2147483647;
                                                        };
                                                        readonly token: {
                                                            readonly type: "string";
                                                        };
                                                        readonly identifierOrCriteria: {
                                                            readonly type: "string";
                                                        };
                                                        readonly startAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endAmount: {
                                                            readonly type: "string";
                                                        };
                                                        readonly recipient: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                                };
                                            };
                                            readonly startTime: {
                                                readonly type: "string";
                                            };
                                            readonly endTime: {
                                                readonly type: "string";
                                            };
                                            readonly orderType: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly zone: {
                                                readonly type: "string";
                                            };
                                            readonly zoneHash: {
                                                readonly type: "string";
                                            };
                                            readonly salt: {
                                                readonly type: "string";
                                            };
                                            readonly conduitKey: {
                                                readonly type: "string";
                                            };
                                            readonly totalOriginalConsiderationItems: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly counter: {
                                                readonly type: "integer";
                                            };
                                        };
                                        readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zone", "zoneHash"];
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["parameters", "signature"];
                            };
                        };
                    };
                    readonly required: readonly ["orders", "transaction"];
                };
            };
            readonly required: readonly ["fulfillment_data", "protocol"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetAccount: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address_or_username: {
                    readonly type: "string";
                    readonly examples: readonly ["0x8ba1f109551bD432803012645Hac136c94C19D6e"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The blockchain address or username of the account to retrieve";
                };
            };
            readonly required: readonly ["address_or_username"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                };
                readonly username: {
                    readonly type: "string";
                };
                readonly profile_image_url: {
                    readonly type: "string";
                };
                readonly banner_image_url: {
                    readonly type: "string";
                };
                readonly website: {
                    readonly type: "string";
                };
                readonly social_media_accounts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly platform: {
                                readonly type: "string";
                            };
                            readonly username: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["platform", "username"];
                    };
                };
                readonly bio: {
                    readonly type: "string";
                };
                readonly joined_date: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly required: readonly ["address", "bio", "joined_date", "social_media_accounts"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetBestListingNft: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "NFT token id";
                };
            };
            readonly required: readonly ["slug", "identifier"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly include_private_listings: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Whether to include private listings; defaults to false";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status", "type"];
            readonly type: "object";
            readonly properties: {
                readonly order_hash: {
                    readonly type: "string";
                };
                readonly chain: {
                    readonly type: "string";
                };
                readonly protocol_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly parameters: {
                            readonly type: "object";
                            readonly additionalProperties: true;
                        };
                        readonly signature: {
                            readonly type: "string";
                        };
                    };
                };
                readonly protocol_address: {
                    readonly type: "string";
                };
                readonly remaining_quantity: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly price: {
                    readonly type: "object";
                    readonly required: readonly ["current"];
                    readonly properties: {
                        readonly current: {
                            readonly type: "object";
                            readonly required: readonly ["currency", "decimals", "value"];
                            readonly properties: {
                                readonly currency: {
                                    readonly type: "string";
                                };
                                readonly decimals: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
                readonly type: {
                    readonly type: "string";
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                    readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetBestListingsCollection: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly include_private_listings: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Whether to include private listings; defaults to false";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly listings: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status", "type"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["current"];
                                readonly properties: {
                                    readonly current: {
                                        readonly type: "object";
                                        readonly required: readonly ["currency", "decimals", "value"];
                                        readonly properties: {
                                            readonly currency: {
                                                readonly type: "string";
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["listings"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetBestOfferNft1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "NFT token id";
                };
            };
            readonly required: readonly ["slug", "identifier"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
            readonly type: "object";
            readonly properties: {
                readonly order_hash: {
                    readonly type: "string";
                };
                readonly chain: {
                    readonly type: "string";
                };
                readonly protocol_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly parameters: {
                            readonly type: "object";
                            readonly additionalProperties: true;
                        };
                        readonly signature: {
                            readonly type: "string";
                        };
                    };
                };
                readonly protocol_address: {
                    readonly type: "string";
                };
                readonly remaining_quantity: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly criteria: {
                    readonly type: "object";
                    readonly required: readonly ["collection"];
                    readonly properties: {
                        readonly collection: {
                            readonly type: "object";
                            readonly required: readonly ["slug"];
                            readonly properties: {
                                readonly slug: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly required: readonly ["address"];
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly trait: {
                            readonly deprecated: true;
                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                            readonly type: "object";
                            readonly required: readonly ["type", "value"];
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly traits: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["type", "value"];
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly price: {
                    readonly type: "object";
                    readonly required: readonly ["currency", "decimals", "value"];
                    readonly properties: {
                        readonly currency: {
                            readonly type: "string";
                        };
                        readonly decimals: {
                            readonly type: "integer";
                            readonly format: "int32";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                        readonly value: {
                            readonly type: "string";
                        };
                    };
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                    readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetCollection: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly examples: readonly ["doodles-official"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique identifier for the specific collection";
                };
            };
            readonly required: readonly ["slug"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly collection: {
                    readonly type: "string";
                };
                readonly name: {
                    readonly type: "string";
                };
                readonly description: {
                    readonly type: "string";
                };
                readonly image_url: {
                    readonly type: "string";
                };
                readonly banner_image_url: {
                    readonly type: "string";
                };
                readonly owner: {
                    readonly type: "string";
                };
                readonly safelist_status: {
                    readonly type: "string";
                };
                readonly category: {
                    readonly type: "string";
                };
                readonly is_disabled: {
                    readonly type: "boolean";
                };
                readonly is_nsfw: {
                    readonly type: "boolean";
                };
                readonly trait_offers_enabled: {
                    readonly type: "boolean";
                };
                readonly collection_offers_enabled: {
                    readonly type: "boolean";
                };
                readonly opensea_url: {
                    readonly type: "string";
                };
                readonly project_url: {
                    readonly type: "string";
                };
                readonly wiki_url: {
                    readonly type: "string";
                };
                readonly discord_url: {
                    readonly type: "string";
                };
                readonly telegram_url: {
                    readonly type: "string";
                };
                readonly twitter_username: {
                    readonly type: "string";
                };
                readonly instagram_username: {
                    readonly type: "string";
                };
                readonly contracts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly address: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["address", "chain"];
                    };
                };
                readonly editors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly fees: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly fee: {
                                readonly type: "number";
                                readonly format: "double";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly recipient: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["fee", "recipient", "required"];
                    };
                };
                readonly required_zone: {
                    readonly type: "string";
                };
                readonly rarity: {
                    readonly type: "object";
                    readonly properties: {
                        readonly calculated_at: {
                            readonly type: "string";
                        };
                        readonly max_rank: {
                            readonly type: "integer";
                            readonly format: "int32";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                        readonly total_supply: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly strategy_id: {
                            readonly type: "string";
                        };
                        readonly strategy_version: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["calculated_at", "max_rank", "strategy_id", "strategy_version", "total_supply"];
                };
                readonly total_supply: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly unique_item_count: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly created_date: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
                readonly payment_tokens: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly symbol: {
                                readonly type: "string";
                            };
                            readonly address: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly image: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly decimals: {
                                readonly type: "integer";
                                readonly format: "int32";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly eth_price: {
                                readonly type: "string";
                            };
                            readonly usd_price: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["address", "chain", "decimals", "eth_price", "image", "name", "symbol", "usd_price"];
                    };
                };
            };
            readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "created_date", "editors", "fees", "is_disabled", "is_nsfw", "name", "opensea_url", "payment_tokens", "safelist_status", "total_supply", "trait_offers_enabled", "unique_item_count"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetCollectionStats: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly examples: readonly ["doodles-official"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique identifier for the specific collection";
                };
            };
            readonly required: readonly ["slug"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly total: {
                    readonly type: "object";
                    readonly properties: {
                        readonly volume: {
                            readonly type: "number";
                            readonly format: "double";
                            readonly minimum: -1.7976931348623157e+308;
                            readonly maximum: 1.7976931348623157e+308;
                        };
                        readonly sales: {
                            readonly type: "integer";
                            readonly format: "int32";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                        readonly num_owners: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly market_cap: {
                            readonly type: "number";
                            readonly format: "double";
                            readonly minimum: -1.7976931348623157e+308;
                            readonly maximum: 1.7976931348623157e+308;
                        };
                        readonly floor_price: {
                            readonly type: "number";
                            readonly format: "double";
                            readonly minimum: -1.7976931348623157e+308;
                            readonly maximum: 1.7976931348623157e+308;
                        };
                        readonly floor_price_symbol: {
                            readonly type: "string";
                        };
                        readonly average_price: {
                            readonly type: "number";
                            readonly format: "double";
                            readonly minimum: -1.7976931348623157e+308;
                            readonly maximum: 1.7976931348623157e+308;
                        };
                    };
                    readonly required: readonly ["average_price", "floor_price", "floor_price_symbol", "market_cap", "num_owners", "sales", "volume"];
                };
                readonly intervals: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly interval: {
                                readonly type: "string";
                            };
                            readonly volume: {
                                readonly type: "number";
                                readonly format: "double";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly volume_diff: {
                                readonly type: "number";
                                readonly format: "double";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly volume_change: {
                                readonly type: "number";
                                readonly format: "double";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly sales: {
                                readonly type: "integer";
                                readonly format: "int32";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly sales_diff: {
                                readonly type: "integer";
                                readonly format: "int32";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly average_price: {
                                readonly type: "number";
                                readonly format: "double";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                        readonly required: readonly ["average_price", "interval", "sales", "sales_diff", "volume", "volume_change", "volume_diff"];
                    };
                };
            };
            readonly required: readonly ["intervals", "total"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetCollectionTraits: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly examples: readonly ["doodles-official"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique identifier for the specific collection";
                };
            };
            readonly required: readonly ["slug"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetContract: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The unique public blockchain identifier for the contract";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["address", "chain"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                };
                readonly chain: {
                    readonly type: "string";
                };
                readonly collection: {
                    readonly type: "string";
                };
                readonly contract_standard: {
                    readonly type: "string";
                };
                readonly name: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["address", "chain", "collection", "contract_standard", "name"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetListings1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Protocol name (e.g. 'seaport')";
                };
            };
            readonly required: readonly ["chain", "protocol"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly asset_contract_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly token_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly maker: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly listed_before: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly listed_after: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly order_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly order_by: {
                    readonly type: "string";
                    readonly enum: readonly ["price", "created_at"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly include_private_listings: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Whether to include private listings; defaults to false";
                };
                readonly cursor: {
                    readonly type: "string";
                    readonly description: "Cursor for pagination. Use the 'next' value from the previous response to get the next page.";
                    readonly examples: readonly ["cursor_abc123def456"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly orders: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly created_date: {
                                readonly type: "string";
                                readonly format: "date-time";
                            };
                            readonly closing_date: {
                                readonly type: "string";
                                readonly format: "date-time";
                            };
                            readonly listing_time: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly expiration_time: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly current_price: {
                                readonly type: "string";
                            };
                            readonly maker: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly profile_img_url: {
                                        readonly type: "string";
                                    };
                                    readonly config: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["address"];
                            };
                            readonly taker: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly profile_img_url: {
                                        readonly type: "string";
                                    };
                                    readonly config: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["address"];
                            };
                            readonly maker_fees: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly account: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                                readonly profile_img_url: {
                                                    readonly type: "string";
                                                };
                                                readonly config: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["address"];
                                        };
                                        readonly basis_points: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["basis_points"];
                                };
                            };
                            readonly taker_fees: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly account: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                                readonly profile_img_url: {
                                                    readonly type: "string";
                                                };
                                                readonly config: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["address"];
                                        };
                                        readonly basis_points: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["basis_points"];
                                };
                            };
                            readonly side: {
                                readonly type: "string";
                            };
                            readonly order_type: {
                                readonly type: "string";
                            };
                            readonly cancelled: {
                                readonly type: "boolean";
                            };
                            readonly finalized: {
                                readonly type: "boolean";
                            };
                            readonly marked_invalid: {
                                readonly type: "boolean";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly maker_asset_bundle: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly assets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "integer";
                                                    readonly format: "int64";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly token_id: {
                                                    readonly type: "string";
                                                };
                                                readonly num_sales: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly background_color: {
                                                    readonly type: "string";
                                                };
                                                readonly image_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_preview_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_thumbnail_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly external_link: {
                                                    readonly type: "string";
                                                };
                                                readonly asset_contract: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly chain_identifier: {
                                                            readonly type: "string";
                                                        };
                                                        readonly schema_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly asset_contract_type: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                                };
                                                readonly permalink: {
                                                    readonly type: "string";
                                                };
                                                readonly collection: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly collection: {
                                                            readonly type: "string";
                                                        };
                                                        readonly name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly description: {
                                                            readonly type: "string";
                                                        };
                                                        readonly image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly banner_image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly owner: {
                                                            readonly type: "string";
                                                        };
                                                        readonly safelist_status: {
                                                            readonly type: "string";
                                                        };
                                                        readonly category: {
                                                            readonly type: "string";
                                                        };
                                                        readonly is_disabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly is_nsfw: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly trait_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly collection_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly opensea_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly project_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly wiki_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly discord_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly telegram_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly twitter_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly instagram_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contracts: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly address: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly chain: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                                readonly required: readonly ["address", "chain"];
                                                            };
                                                        };
                                                    };
                                                    readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                                };
                                                readonly decimals: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly token_metadata: {
                                                    readonly type: "string";
                                                };
                                                readonly is_nsfw: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly profile_img_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly config: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address"];
                                                };
                                            };
                                            readonly required: readonly ["asset_contract", "token_id"];
                                        };
                                    };
                                    readonly maker: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly asset_contract: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly chain_identifier: {
                                                readonly type: "string";
                                            };
                                            readonly schema_name: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract_type: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                    };
                                    readonly slug: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly external_link: {
                                        readonly type: "string";
                                    };
                                    readonly permalink: {
                                        readonly type: "string";
                                    };
                                    readonly seaport_sell_orders: {
                                        readonly type: "array";
                                        readonly items: {};
                                    };
                                };
                                readonly required: readonly ["assets"];
                            };
                            readonly taker_asset_bundle: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly assets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "integer";
                                                    readonly format: "int64";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly token_id: {
                                                    readonly type: "string";
                                                };
                                                readonly num_sales: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly background_color: {
                                                    readonly type: "string";
                                                };
                                                readonly image_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_preview_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_thumbnail_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly external_link: {
                                                    readonly type: "string";
                                                };
                                                readonly asset_contract: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly chain_identifier: {
                                                            readonly type: "string";
                                                        };
                                                        readonly schema_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly asset_contract_type: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                                };
                                                readonly permalink: {
                                                    readonly type: "string";
                                                };
                                                readonly collection: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly collection: {
                                                            readonly type: "string";
                                                        };
                                                        readonly name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly description: {
                                                            readonly type: "string";
                                                        };
                                                        readonly image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly banner_image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly owner: {
                                                            readonly type: "string";
                                                        };
                                                        readonly safelist_status: {
                                                            readonly type: "string";
                                                        };
                                                        readonly category: {
                                                            readonly type: "string";
                                                        };
                                                        readonly is_disabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly is_nsfw: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly trait_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly collection_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly opensea_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly project_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly wiki_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly discord_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly telegram_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly twitter_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly instagram_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contracts: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly address: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly chain: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                                readonly required: readonly ["address", "chain"];
                                                            };
                                                        };
                                                    };
                                                    readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                                };
                                                readonly decimals: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly token_metadata: {
                                                    readonly type: "string";
                                                };
                                                readonly is_nsfw: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly profile_img_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly config: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address"];
                                                };
                                            };
                                            readonly required: readonly ["asset_contract", "token_id"];
                                        };
                                    };
                                    readonly maker: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly asset_contract: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly chain_identifier: {
                                                readonly type: "string";
                                            };
                                            readonly schema_name: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract_type: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                    };
                                    readonly slug: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly external_link: {
                                        readonly type: "string";
                                    };
                                    readonly permalink: {
                                        readonly type: "string";
                                    };
                                    readonly seaport_sell_orders: {
                                        readonly type: "array";
                                        readonly items: {};
                                    };
                                };
                                readonly required: readonly ["assets"];
                            };
                        };
                        readonly required: readonly ["cancelled", "created_date", "current_price", "expiration_time", "finalized", "listing_time", "maker_fees", "marked_invalid", "order_hash", "order_type", "remaining_quantity", "side", "taker_fees"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["orders"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetNft1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly address: {
                    readonly type: "string";
                    readonly examples: readonly ["0x8ba1f109551bD432803012645Hac136c94C19D6e"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The unique public blockchain identifier for the contract";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly examples: readonly [1];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The NFT token id";
                };
            };
            readonly required: readonly ["chain", "address", "identifier"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly nft: {
                    readonly type: "object";
                    readonly properties: {
                        readonly identifier: {
                            readonly type: "string";
                        };
                        readonly collection: {
                            readonly type: "string";
                        };
                        readonly contract: {
                            readonly type: "string";
                        };
                        readonly token_standard: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly description: {
                            readonly type: "string";
                        };
                        readonly image_url: {
                            readonly type: "string";
                        };
                        readonly display_image_url: {
                            readonly type: "string";
                        };
                        readonly display_animation_url: {
                            readonly type: "string";
                        };
                        readonly metadata_url: {
                            readonly type: "string";
                        };
                        readonly opensea_url: {
                            readonly type: "string";
                        };
                        readonly updated_at: {
                            readonly type: "string";
                        };
                        readonly is_disabled: {
                            readonly type: "boolean";
                        };
                        readonly is_nsfw: {
                            readonly type: "boolean";
                        };
                        readonly animation_url: {
                            readonly type: "string";
                        };
                        readonly is_suspicious: {
                            readonly type: "boolean";
                        };
                        readonly creator: {
                            readonly type: "string";
                        };
                        readonly traits: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly trait_type: {
                                        readonly type: "string";
                                    };
                                    readonly display_type: {
                                        readonly type: "string";
                                    };
                                    readonly max_value: {
                                        readonly type: "string";
                                    };
                                    readonly value: {};
                                };
                                readonly required: readonly ["trait_type", "value"];
                            };
                        };
                        readonly owners: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly quantity: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                };
                                readonly required: readonly ["address", "quantity"];
                            };
                        };
                        readonly rarity: {
                            readonly type: "object";
                            readonly properties: {
                                readonly strategy_id: {
                                    readonly type: "string";
                                };
                                readonly strategy_version: {
                                    readonly type: "string";
                                };
                                readonly rank: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                            };
                            readonly required: readonly ["strategy_id", "strategy_version"];
                        };
                    };
                    readonly required: readonly ["collection", "contract", "creator", "identifier", "is_disabled", "is_nsfw", "is_suspicious", "opensea_url", "owners", "token_standard", "traits", "updated_at"];
                };
            };
            readonly required: readonly ["nft"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetNftMetadata: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly contractAddress: {
                    readonly type: "string";
                    readonly examples: readonly ["0x8ba1f109551bD432803012645Hac136c94C19D6e"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The unique public blockchain identifier for the contract";
                };
                readonly tokenId: {
                    readonly type: "string";
                    readonly examples: readonly [1];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The NFT token id";
                };
            };
            readonly required: readonly ["chain", "contractAddress", "tokenId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                };
                readonly description: {
                    readonly type: "string";
                };
                readonly image: {
                    readonly type: "string";
                };
                readonly external_link: {
                    readonly type: "string";
                };
                readonly animation_url: {
                    readonly type: "string";
                };
                readonly traits: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly trait_type: {
                                readonly type: "string";
                            };
                            readonly display_type: {
                                readonly type: "string";
                            };
                            readonly max_value: {
                                readonly type: "string";
                            };
                            readonly value: {};
                        };
                        readonly required: readonly ["trait_type", "value"];
                    };
                };
            };
            readonly required: readonly ["traits"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetNftsByAccount: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Account address";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["address", "chain"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly collection: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly nfts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly identifier: {
                                readonly type: "string";
                            };
                            readonly collection: {
                                readonly type: "string";
                            };
                            readonly contract: {
                                readonly type: "string";
                            };
                            readonly token_standard: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly image_url: {
                                readonly type: "string";
                            };
                            readonly display_image_url: {
                                readonly type: "string";
                            };
                            readonly display_animation_url: {
                                readonly type: "string";
                            };
                            readonly metadata_url: {
                                readonly type: "string";
                            };
                            readonly opensea_url: {
                                readonly type: "string";
                            };
                            readonly updated_at: {
                                readonly type: "string";
                            };
                            readonly is_disabled: {
                                readonly type: "boolean";
                            };
                            readonly is_nsfw: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["nfts"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetNftsByCollection: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Collection slug";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly nfts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly identifier: {
                                readonly type: "string";
                            };
                            readonly collection: {
                                readonly type: "string";
                            };
                            readonly contract: {
                                readonly type: "string";
                            };
                            readonly token_standard: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly image_url: {
                                readonly type: "string";
                            };
                            readonly display_image_url: {
                                readonly type: "string";
                            };
                            readonly display_animation_url: {
                                readonly type: "string";
                            };
                            readonly metadata_url: {
                                readonly type: "string";
                            };
                            readonly opensea_url: {
                                readonly type: "string";
                            };
                            readonly updated_at: {
                                readonly type: "string";
                            };
                            readonly is_disabled: {
                                readonly type: "boolean";
                            };
                            readonly is_nsfw: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["nfts"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetNftsByContract1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Contract address";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["address", "chain"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly nfts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly identifier: {
                                readonly type: "string";
                            };
                            readonly collection: {
                                readonly type: "string";
                            };
                            readonly contract: {
                                readonly type: "string";
                            };
                            readonly token_standard: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly image_url: {
                                readonly type: "string";
                            };
                            readonly display_image_url: {
                                readonly type: "string";
                            };
                            readonly display_animation_url: {
                                readonly type: "string";
                            };
                            readonly metadata_url: {
                                readonly type: "string";
                            };
                            readonly opensea_url: {
                                readonly type: "string";
                            };
                            readonly updated_at: {
                                readonly type: "string";
                            };
                            readonly is_disabled: {
                                readonly type: "boolean";
                            };
                            readonly is_nsfw: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["nfts"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetOffers: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Protocol name (e.g. 'seaport')";
                };
            };
            readonly required: readonly ["chain", "protocol"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly asset_contract_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly token_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly maker: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly order_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly order_by: {
                    readonly type: "string";
                    readonly enum: readonly ["price", "created_at"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly listed_before: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly listed_after: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly payment_token_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly cursor: {
                    readonly type: "string";
                    readonly description: "Cursor for pagination. Use the 'next' value from the previous response to get the next page.";
                    readonly examples: readonly ["cursor_abc123def456"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly orders: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly created_date: {
                                readonly type: "string";
                                readonly format: "date-time";
                            };
                            readonly closing_date: {
                                readonly type: "string";
                                readonly format: "date-time";
                            };
                            readonly listing_time: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly expiration_time: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly current_price: {
                                readonly type: "string";
                            };
                            readonly maker: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly profile_img_url: {
                                        readonly type: "string";
                                    };
                                    readonly config: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["address"];
                            };
                            readonly taker: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly profile_img_url: {
                                        readonly type: "string";
                                    };
                                    readonly config: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["address"];
                            };
                            readonly maker_fees: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly account: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                                readonly profile_img_url: {
                                                    readonly type: "string";
                                                };
                                                readonly config: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["address"];
                                        };
                                        readonly basis_points: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["basis_points"];
                                };
                            };
                            readonly taker_fees: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly account: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                                readonly profile_img_url: {
                                                    readonly type: "string";
                                                };
                                                readonly config: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["address"];
                                        };
                                        readonly basis_points: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["basis_points"];
                                };
                            };
                            readonly side: {
                                readonly type: "string";
                            };
                            readonly order_type: {
                                readonly type: "string";
                            };
                            readonly cancelled: {
                                readonly type: "boolean";
                            };
                            readonly finalized: {
                                readonly type: "boolean";
                            };
                            readonly marked_invalid: {
                                readonly type: "boolean";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly maker_asset_bundle: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly assets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "integer";
                                                    readonly format: "int64";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly token_id: {
                                                    readonly type: "string";
                                                };
                                                readonly num_sales: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly background_color: {
                                                    readonly type: "string";
                                                };
                                                readonly image_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_preview_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_thumbnail_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly external_link: {
                                                    readonly type: "string";
                                                };
                                                readonly asset_contract: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly chain_identifier: {
                                                            readonly type: "string";
                                                        };
                                                        readonly schema_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly asset_contract_type: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                                };
                                                readonly permalink: {
                                                    readonly type: "string";
                                                };
                                                readonly collection: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly collection: {
                                                            readonly type: "string";
                                                        };
                                                        readonly name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly description: {
                                                            readonly type: "string";
                                                        };
                                                        readonly image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly banner_image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly owner: {
                                                            readonly type: "string";
                                                        };
                                                        readonly safelist_status: {
                                                            readonly type: "string";
                                                        };
                                                        readonly category: {
                                                            readonly type: "string";
                                                        };
                                                        readonly is_disabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly is_nsfw: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly trait_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly collection_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly opensea_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly project_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly wiki_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly discord_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly telegram_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly twitter_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly instagram_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contracts: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly address: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly chain: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                                readonly required: readonly ["address", "chain"];
                                                            };
                                                        };
                                                    };
                                                    readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                                };
                                                readonly decimals: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly token_metadata: {
                                                    readonly type: "string";
                                                };
                                                readonly is_nsfw: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly profile_img_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly config: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address"];
                                                };
                                            };
                                            readonly required: readonly ["asset_contract", "token_id"];
                                        };
                                    };
                                    readonly maker: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly asset_contract: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly chain_identifier: {
                                                readonly type: "string";
                                            };
                                            readonly schema_name: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract_type: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                    };
                                    readonly slug: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly external_link: {
                                        readonly type: "string";
                                    };
                                    readonly permalink: {
                                        readonly type: "string";
                                    };
                                    readonly seaport_sell_orders: {
                                        readonly type: "array";
                                        readonly items: {};
                                    };
                                };
                                readonly required: readonly ["assets"];
                            };
                            readonly taker_asset_bundle: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly assets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "integer";
                                                    readonly format: "int64";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly token_id: {
                                                    readonly type: "string";
                                                };
                                                readonly num_sales: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly background_color: {
                                                    readonly type: "string";
                                                };
                                                readonly image_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_preview_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_thumbnail_url: {
                                                    readonly type: "string";
                                                };
                                                readonly image_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_url: {
                                                    readonly type: "string";
                                                };
                                                readonly animation_original_url: {
                                                    readonly type: "string";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly external_link: {
                                                    readonly type: "string";
                                                };
                                                readonly asset_contract: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly chain_identifier: {
                                                            readonly type: "string";
                                                        };
                                                        readonly schema_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly asset_contract_type: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                                };
                                                readonly permalink: {
                                                    readonly type: "string";
                                                };
                                                readonly collection: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly collection: {
                                                            readonly type: "string";
                                                        };
                                                        readonly name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly description: {
                                                            readonly type: "string";
                                                        };
                                                        readonly image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly banner_image_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly owner: {
                                                            readonly type: "string";
                                                        };
                                                        readonly safelist_status: {
                                                            readonly type: "string";
                                                        };
                                                        readonly category: {
                                                            readonly type: "string";
                                                        };
                                                        readonly is_disabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly is_nsfw: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly trait_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly collection_offers_enabled: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly opensea_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly project_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly wiki_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly discord_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly telegram_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly twitter_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly instagram_username: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contracts: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly address: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly chain: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                                readonly required: readonly ["address", "chain"];
                                                            };
                                                        };
                                                    };
                                                    readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                                };
                                                readonly decimals: {
                                                    readonly type: "integer";
                                                    readonly format: "int32";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly token_metadata: {
                                                    readonly type: "string";
                                                };
                                                readonly is_nsfw: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly address: {
                                                            readonly type: "string";
                                                        };
                                                        readonly profile_img_url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly config: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["address"];
                                                };
                                            };
                                            readonly required: readonly ["asset_contract", "token_id"];
                                        };
                                    };
                                    readonly maker: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly asset_contract: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly chain_identifier: {
                                                readonly type: "string";
                                            };
                                            readonly schema_name: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract_type: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                    };
                                    readonly slug: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly external_link: {
                                        readonly type: "string";
                                    };
                                    readonly permalink: {
                                        readonly type: "string";
                                    };
                                    readonly seaport_sell_orders: {
                                        readonly type: "array";
                                        readonly items: {};
                                    };
                                };
                                readonly required: readonly ["assets"];
                            };
                        };
                        readonly required: readonly ["cancelled", "created_date", "current_price", "expiration_time", "finalized", "listing_time", "maker_fees", "marked_invalid", "order_hash", "order_type", "remaining_quantity", "side", "taker_fees"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["orders"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetOffersCollection: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly offers: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly criteria: {
                                readonly type: "object";
                                readonly required: readonly ["collection"];
                                readonly properties: {
                                    readonly collection: {
                                        readonly type: "object";
                                        readonly required: readonly ["slug"];
                                        readonly properties: {
                                            readonly slug: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly contract: {
                                        readonly type: "object";
                                        readonly required: readonly ["address"];
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly trait: {
                                        readonly deprecated: true;
                                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                        readonly type: "object";
                                        readonly required: readonly ["type", "value"];
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly traits: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["currency", "decimals", "value"];
                                readonly properties: {
                                    readonly currency: {
                                        readonly type: "string";
                                    };
                                    readonly decimals: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["offers"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetOffersCollectionTrait1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly deprecated: true;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trait type (deprecated: use 'traits' parameter)";
                };
                readonly value: {
                    readonly type: "string";
                    readonly deprecated: true;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trait value as string (deprecated: use 'traits' parameter)";
                };
                readonly float_value: {
                    readonly type: "number";
                    readonly format: "double";
                    readonly deprecated: true;
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trait value as float (deprecated: use 'traits' parameter)";
                };
                readonly int_value: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly deprecated: true;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trait value as integer (deprecated: use 'traits' parameter)";
                };
                readonly traits: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "JSON array of trait filters. Each trait has 'traitType' and 'value' fields. Example: [{\"traitType\":\"Background\",\"value\":\"Red\"},{\"traitType\":\"Eyes\",\"value\":\"Blue\"}]";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly offers: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly criteria: {
                                readonly type: "object";
                                readonly required: readonly ["collection"];
                                readonly properties: {
                                    readonly collection: {
                                        readonly type: "object";
                                        readonly required: readonly ["slug"];
                                        readonly properties: {
                                            readonly slug: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly contract: {
                                        readonly type: "object";
                                        readonly required: readonly ["address"];
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly trait: {
                                        readonly deprecated: true;
                                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                        readonly type: "object";
                                        readonly required: readonly ["type", "value"];
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly traits: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["currency", "decimals", "value"];
                                readonly properties: {
                                    readonly currency: {
                                        readonly type: "string";
                                    };
                                    readonly decimals: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["offers"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetOffersNft1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "NFT token id";
                };
            };
            readonly required: readonly ["slug", "identifier"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly offers: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly criteria: {
                                readonly type: "object";
                                readonly required: readonly ["collection"];
                                readonly properties: {
                                    readonly collection: {
                                        readonly type: "object";
                                        readonly required: readonly ["slug"];
                                        readonly properties: {
                                            readonly slug: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly contract: {
                                        readonly type: "object";
                                        readonly required: readonly ["address"];
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly trait: {
                                        readonly deprecated: true;
                                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                        readonly type: "object";
                                        readonly required: readonly ["type", "value"];
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly traits: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["currency", "decimals", "value"];
                                readonly properties: {
                                    readonly currency: {
                                        readonly type: "string";
                                    };
                                    readonly decimals: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["offers"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetOrder1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol_address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Protocol contract address";
                };
                readonly order_hash: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Order hash";
                };
            };
            readonly required: readonly ["chain", "protocol_address", "order_hash"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly order: {
                    readonly oneOf: readonly [{
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status", "type"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["current"];
                                readonly properties: {
                                    readonly current: {
                                        readonly type: "object";
                                        readonly required: readonly ["currency", "decimals", "value"];
                                        readonly properties: {
                                            readonly currency: {
                                                readonly type: "string";
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    }, {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly criteria: {
                                readonly type: "object";
                                readonly required: readonly ["collection"];
                                readonly properties: {
                                    readonly collection: {
                                        readonly type: "object";
                                        readonly required: readonly ["slug"];
                                        readonly properties: {
                                            readonly slug: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly contract: {
                                        readonly type: "object";
                                        readonly required: readonly ["address"];
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly trait: {
                                        readonly deprecated: true;
                                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                        readonly type: "object";
                                        readonly required: readonly ["type", "value"];
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly traits: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["currency", "decimals", "value"];
                                readonly properties: {
                                    readonly currency: {
                                        readonly type: "string";
                                    };
                                    readonly decimals: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    }];
                };
            };
            readonly required: readonly ["order"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetPaymentToken: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The unique public blockchain identifier for the contract";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["address", "chain"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                };
                readonly address: {
                    readonly type: "string";
                };
                readonly chain: {
                    readonly type: "string";
                };
                readonly image: {
                    readonly type: "string";
                };
                readonly name: {
                    readonly type: "string";
                };
                readonly decimals: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly eth_price: {
                    readonly type: "string";
                };
                readonly usd_price: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["address", "chain", "decimals", "eth_price", "image", "name", "symbol", "usd_price"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListCollections: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["collection_cursor_abc123"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of collections to return per page";
                    readonly maximum: 100;
                    readonly minimum: 1;
                    readonly examples: readonly [10];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "Blockchain to filter by";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly creator_username: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Username of collection creator to filter by";
                };
                readonly include_hidden: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Include hidden collections in results";
                };
                readonly order_by: {
                    readonly type: "string";
                    readonly examples: readonly ["created_date"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Field to order results by";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly collections: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly collection: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly image_url: {
                                readonly type: "string";
                            };
                            readonly banner_image_url: {
                                readonly type: "string";
                            };
                            readonly owner: {
                                readonly type: "string";
                            };
                            readonly safelist_status: {
                                readonly type: "string";
                            };
                            readonly category: {
                                readonly type: "string";
                            };
                            readonly is_disabled: {
                                readonly type: "boolean";
                            };
                            readonly is_nsfw: {
                                readonly type: "boolean";
                            };
                            readonly trait_offers_enabled: {
                                readonly type: "boolean";
                            };
                            readonly collection_offers_enabled: {
                                readonly type: "boolean";
                            };
                            readonly opensea_url: {
                                readonly type: "string";
                            };
                            readonly project_url: {
                                readonly type: "string";
                            };
                            readonly wiki_url: {
                                readonly type: "string";
                            };
                            readonly discord_url: {
                                readonly type: "string";
                            };
                            readonly telegram_url: {
                                readonly type: "string";
                            };
                            readonly twitter_username: {
                                readonly type: "string";
                            };
                            readonly instagram_username: {
                                readonly type: "string";
                            };
                            readonly contracts: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address", "chain"];
                                };
                            };
                        };
                        readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["collections"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListEvents1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly after: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events after this timestamp (Unix timestamp in seconds)";
                };
                readonly before: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events before this timestamp (Unix timestamp in seconds)";
                };
                readonly event_type: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["sale", "transfer", "mint", "listing", "offer", "trait_offer", "collection_offer"];
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Filter by event types. To get order invalidation and revalidation events, please use the Stream API. The order status can also be checked on the Get Order endpoint.";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly asset_events: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "is_private_listing", "maker", "order_type", "quantity"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly order_type: {
                                    readonly type: "string";
                                };
                                readonly start_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly expiration_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly taker: {
                                    readonly type: "string";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection"];
                                    readonly properties: {
                                        readonly collection: {
                                            readonly type: "object";
                                            readonly required: readonly ["slug"];
                                            readonly properties: {
                                                readonly slug: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly contract: {
                                            readonly type: "object";
                                            readonly required: readonly ["address"];
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly trait: {
                                            readonly deprecated: true;
                                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly traits: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "value"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly is_private_listing: {
                                    readonly type: "boolean";
                                };
                            };
                        }, {
                            readonly required: readonly ["buyer", "chain", "closing_date", "event_timestamp", "event_type", "quantity", "seller"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly closing_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly seller: {
                                    readonly type: "string";
                                };
                                readonly buyer: {
                                    readonly type: "string";
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "from_address", "quantity", "to_address"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly from_address: {
                                    readonly type: "string";
                                };
                                readonly to_address: {
                                    readonly type: "string";
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                            };
                        }];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["asset_events"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListEventsByAccount1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly examples: readonly ["0x8ba1f109551bD432803012645Hac136c94C19D6e"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The blockchain address of the account";
                };
            };
            readonly required: readonly ["address"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly after: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events after this timestamp (Unix timestamp in seconds)";
                };
                readonly before: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events before this timestamp (Unix timestamp in seconds)";
                };
                readonly event_type: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["sale", "transfer", "mint", "listing", "offer", "trait_offer", "collection_offer"];
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Filter by event types. To get order invalidation and revalidation events, please use the Stream API. The order status can also be checked on the Get Order endpoint.";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "Filter by blockchain";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly asset_events: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "is_private_listing", "maker", "order_type", "quantity"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly order_type: {
                                    readonly type: "string";
                                };
                                readonly start_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly expiration_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly taker: {
                                    readonly type: "string";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection"];
                                    readonly properties: {
                                        readonly collection: {
                                            readonly type: "object";
                                            readonly required: readonly ["slug"];
                                            readonly properties: {
                                                readonly slug: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly contract: {
                                            readonly type: "object";
                                            readonly required: readonly ["address"];
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly trait: {
                                            readonly deprecated: true;
                                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly traits: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "value"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly is_private_listing: {
                                    readonly type: "boolean";
                                };
                            };
                        }, {
                            readonly required: readonly ["buyer", "chain", "closing_date", "event_timestamp", "event_type", "quantity", "seller"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly closing_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly seller: {
                                    readonly type: "string";
                                };
                                readonly buyer: {
                                    readonly type: "string";
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "from_address", "quantity", "to_address"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly from_address: {
                                    readonly type: "string";
                                };
                                readonly to_address: {
                                    readonly type: "string";
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                            };
                        }];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["asset_events"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListEventsByCollection: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly examples: readonly ["doodles-official"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique identifier for the collection";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly after: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events after this timestamp (Unix timestamp in seconds)";
                };
                readonly before: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events before this timestamp (Unix timestamp in seconds)";
                };
                readonly event_type: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["sale", "transfer", "mint", "listing", "offer", "trait_offer", "collection_offer"];
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Filter by event types. To get order invalidation and revalidation events, please use the Stream API. The order status can also be checked on the Get Order endpoint.";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly asset_events: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "is_private_listing", "maker", "order_type", "quantity"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly order_type: {
                                    readonly type: "string";
                                };
                                readonly start_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly expiration_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly taker: {
                                    readonly type: "string";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection"];
                                    readonly properties: {
                                        readonly collection: {
                                            readonly type: "object";
                                            readonly required: readonly ["slug"];
                                            readonly properties: {
                                                readonly slug: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly contract: {
                                            readonly type: "object";
                                            readonly required: readonly ["address"];
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly trait: {
                                            readonly deprecated: true;
                                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly traits: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "value"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly is_private_listing: {
                                    readonly type: "boolean";
                                };
                            };
                        }, {
                            readonly required: readonly ["buyer", "chain", "closing_date", "event_timestamp", "event_type", "quantity", "seller"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly closing_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly seller: {
                                    readonly type: "string";
                                };
                                readonly buyer: {
                                    readonly type: "string";
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "from_address", "quantity", "to_address"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly from_address: {
                                    readonly type: "string";
                                };
                                readonly to_address: {
                                    readonly type: "string";
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                            };
                        }];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["asset_events"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListEventsByNft1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly address: {
                    readonly type: "string";
                    readonly examples: readonly ["0x8ba1f109551bD432803012645Hac136c94C19D6e"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The unique public blockchain identifier for the contract";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly examples: readonly [1];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The NFT token id";
                };
            };
            readonly required: readonly ["chain", "address", "identifier"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly after: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events after this timestamp (Unix timestamp in seconds)";
                };
                readonly before: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Only show events before this timestamp (Unix timestamp in seconds)";
                };
                readonly event_type: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["sale", "transfer", "mint", "listing", "offer", "trait_offer", "collection_offer"];
                    };
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Filter by event types. To get order invalidation and revalidation events, please use the Stream API. The order status can also be checked on the Get Order endpoint.";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly asset_events: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "is_private_listing", "maker", "order_type", "quantity"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly order_type: {
                                    readonly type: "string";
                                };
                                readonly start_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly expiration_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly taker: {
                                    readonly type: "string";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection"];
                                    readonly properties: {
                                        readonly collection: {
                                            readonly type: "object";
                                            readonly required: readonly ["slug"];
                                            readonly properties: {
                                                readonly slug: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly contract: {
                                            readonly type: "object";
                                            readonly required: readonly ["address"];
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly trait: {
                                            readonly deprecated: true;
                                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly traits: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "value"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly is_private_listing: {
                                    readonly type: "boolean";
                                };
                            };
                        }, {
                            readonly required: readonly ["buyer", "chain", "closing_date", "event_timestamp", "event_type", "quantity", "seller"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly closing_date: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly seller: {
                                    readonly type: "string";
                                };
                                readonly buyer: {
                                    readonly type: "string";
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly required: readonly ["chain", "event_timestamp", "event_type", "from_address", "quantity", "to_address"];
                            readonly type: "object";
                            readonly properties: {
                                readonly event_type: {
                                    readonly type: "string";
                                };
                                readonly event_timestamp: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                                readonly transaction: {
                                    readonly type: "string";
                                };
                                readonly order_hash: {
                                    readonly type: "string";
                                };
                                readonly protocol_address: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                };
                                readonly payment: {
                                    readonly type: "object";
                                    readonly required: readonly ["decimals", "quantity", "symbol", "token_address"];
                                    readonly properties: {
                                        readonly quantity: {
                                            readonly type: "string";
                                        };
                                        readonly token_address: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly from_address: {
                                    readonly type: "string";
                                };
                                readonly to_address: {
                                    readonly type: "string";
                                };
                                readonly nft: {
                                    readonly type: "object";
                                    readonly required: readonly ["collection", "contract", "identifier", "is_disabled", "is_nsfw", "opensea_url", "token_standard", "updated_at"];
                                    readonly properties: {
                                        readonly identifier: {
                                            readonly type: "string";
                                        };
                                        readonly collection: {
                                            readonly type: "string";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly token_standard: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_image_url: {
                                            readonly type: "string";
                                        };
                                        readonly display_animation_url: {
                                            readonly type: "string";
                                        };
                                        readonly metadata_url: {
                                            readonly type: "string";
                                        };
                                        readonly opensea_url: {
                                            readonly type: "string";
                                        };
                                        readonly updated_at: {
                                            readonly type: "string";
                                        };
                                        readonly is_disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly is_nsfw: {
                                            readonly type: "boolean";
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "integer";
                                    readonly format: "int64";
                                    readonly minimum: -9223372036854776000;
                                    readonly maximum: 9223372036854776000;
                                };
                            };
                        }];
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["asset_events"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListListingsCollectionAll1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly include_private_listings: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Whether to include private listings; defaults to false";
                };
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly listings: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status", "type"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["current"];
                                readonly properties: {
                                    readonly current: {
                                        readonly type: "object";
                                        readonly required: readonly ["currency", "decimals", "value"];
                                        readonly properties: {
                                            readonly currency: {
                                                readonly type: "string";
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["listings"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListOffersCollectionAll1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unique string to identify a collection on OpenSea";
                };
            };
            readonly required: readonly ["slug"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly next: {
                    readonly type: "string";
                    readonly description: "Token for getting the next page of results. Use the 'next' value from the previous response.";
                    readonly examples: readonly ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly description: "Number of items to return per page";
                    readonly maximum: 200;
                    readonly minimum: 1;
                    readonly examples: readonly [20];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly offers: {
                    readonly type: "array";
                    readonly items: {
                        readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
                        readonly type: "object";
                        readonly properties: {
                            readonly order_hash: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                            };
                            readonly protocol_data: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly parameters: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly signature: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly protocol_address: {
                                readonly type: "string";
                            };
                            readonly remaining_quantity: {
                                readonly type: "integer";
                                readonly format: "int64";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly criteria: {
                                readonly type: "object";
                                readonly required: readonly ["collection"];
                                readonly properties: {
                                    readonly collection: {
                                        readonly type: "object";
                                        readonly required: readonly ["slug"];
                                        readonly properties: {
                                            readonly slug: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly contract: {
                                        readonly type: "object";
                                        readonly required: readonly ["address"];
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly trait: {
                                        readonly deprecated: true;
                                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                                        readonly type: "object";
                                        readonly required: readonly ["type", "value"];
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly traits: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly required: readonly ["type", "value"];
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["currency", "decimals", "value"];
                                readonly properties: {
                                    readonly currency: {
                                        readonly type: "string";
                                    };
                                    readonly decimals: {
                                        readonly type: "integer";
                                        readonly format: "int32";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                                readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                            };
                        };
                    };
                };
                readonly next: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["offers"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostCriteriaOfferV2: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly protocol_data: {
                readonly type: "object";
                readonly properties: {
                    readonly parameters: {
                        readonly type: "object";
                        readonly properties: {
                            readonly offerer: {
                                readonly type: "string";
                            };
                            readonly zone: {
                                readonly type: "string";
                            };
                            readonly offer: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly itemType: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly token: {
                                            readonly type: "string";
                                        };
                                        readonly identifierOrCriteria: {
                                            readonly type: "string";
                                        };
                                        readonly startAmount: {
                                            readonly type: "string";
                                        };
                                        readonly endAmount: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                                };
                            };
                            readonly consideration: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly itemType: {
                                            readonly type: "integer";
                                            readonly format: "int32";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly token: {
                                            readonly type: "string";
                                        };
                                        readonly identifierOrCriteria: {
                                            readonly type: "string";
                                        };
                                        readonly startAmount: {
                                            readonly type: "string";
                                        };
                                        readonly endAmount: {
                                            readonly type: "string";
                                        };
                                        readonly recipient: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                                };
                            };
                            readonly orderType: {
                                readonly type: "integer";
                                readonly format: "int32";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly startTime: {
                                readonly type: "string";
                            };
                            readonly endTime: {
                                readonly type: "string";
                            };
                            readonly zoneHash: {
                                readonly type: "string";
                            };
                            readonly salt: {
                                readonly type: "string";
                            };
                            readonly conduitKey: {
                                readonly type: "string";
                            };
                            readonly totalOriginalConsiderationItems: {
                                readonly type: "integer";
                                readonly format: "int32";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly counter: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zoneHash"];
                    };
                    readonly signature: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["parameters", "signature"];
            };
            readonly criteria: {
                readonly type: "object";
                readonly properties: {
                    readonly collection: {
                        readonly type: "object";
                        readonly properties: {
                            readonly slug: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["slug"];
                    };
                    readonly contract: {
                        readonly type: "object";
                        readonly properties: {
                            readonly address: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["address"];
                    };
                    readonly trait: {
                        readonly deprecated: true;
                        readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                        readonly type: "object";
                        readonly properties: {
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["type", "value"];
                    };
                    readonly traits: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["type", "value"];
                        };
                    };
                };
                readonly required: readonly ["collection"];
            };
            readonly protocol_address: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["criteria", "protocol_address", "protocol_data"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly required: readonly ["chain", "order_hash", "price", "remaining_quantity", "status"];
            readonly type: "object";
            readonly properties: {
                readonly order_hash: {
                    readonly type: "string";
                };
                readonly chain: {
                    readonly type: "string";
                };
                readonly protocol_data: {
                    readonly type: "object";
                    readonly properties: {
                        readonly parameters: {
                            readonly type: "object";
                            readonly additionalProperties: true;
                        };
                        readonly signature: {
                            readonly type: "string";
                        };
                    };
                };
                readonly protocol_address: {
                    readonly type: "string";
                };
                readonly remaining_quantity: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly criteria: {
                    readonly type: "object";
                    readonly required: readonly ["collection"];
                    readonly properties: {
                        readonly collection: {
                            readonly type: "object";
                            readonly required: readonly ["slug"];
                            readonly properties: {
                                readonly slug: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly required: readonly ["address"];
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly trait: {
                            readonly deprecated: true;
                            readonly description: "Deprecated: Use 'traits' array instead which supports both single and multiple traits.";
                            readonly type: "object";
                            readonly required: readonly ["type", "value"];
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly traits: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["type", "value"];
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly price: {
                    readonly type: "object";
                    readonly required: readonly ["currency", "decimals", "value"];
                    readonly properties: {
                        readonly currency: {
                            readonly type: "string";
                        };
                        readonly decimals: {
                            readonly type: "integer";
                            readonly format: "int32";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                        readonly value: {
                            readonly type: "string";
                        };
                    };
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["ACTIVE", "INACTIVE", "FULFILLED", "EXPIRED", "CANCELLED"];
                    readonly description: "`ACTIVE` `INACTIVE` `FULFILLED` `EXPIRED` `CANCELLED`";
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostListing1: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly parameters: {
                readonly type: "object";
                readonly properties: {
                    readonly offerer: {
                        readonly type: "string";
                    };
                    readonly zone: {
                        readonly type: "string";
                    };
                    readonly offer: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly itemType: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly token: {
                                    readonly type: "string";
                                };
                                readonly identifierOrCriteria: {
                                    readonly type: "string";
                                };
                                readonly startAmount: {
                                    readonly type: "string";
                                };
                                readonly endAmount: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                        };
                    };
                    readonly consideration: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly itemType: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly token: {
                                    readonly type: "string";
                                };
                                readonly identifierOrCriteria: {
                                    readonly type: "string";
                                };
                                readonly startAmount: {
                                    readonly type: "string";
                                };
                                readonly endAmount: {
                                    readonly type: "string";
                                };
                                readonly recipient: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                        };
                    };
                    readonly orderType: {
                        readonly type: "integer";
                        readonly format: "int32";
                        readonly minimum: -2147483648;
                        readonly maximum: 2147483647;
                    };
                    readonly startTime: {
                        readonly type: "string";
                    };
                    readonly endTime: {
                        readonly type: "string";
                    };
                    readonly zoneHash: {
                        readonly type: "string";
                    };
                    readonly salt: {
                        readonly type: "string";
                    };
                    readonly conduitKey: {
                        readonly type: "string";
                    };
                    readonly totalOriginalConsiderationItems: {
                        readonly type: "integer";
                        readonly format: "int32";
                        readonly minimum: -2147483648;
                        readonly maximum: 2147483647;
                    };
                    readonly counter: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zoneHash"];
            };
            readonly protocol_address: {
                readonly type: "string";
            };
            readonly signature: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["parameters", "protocol_address", "signature"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["chain", "protocol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly order: {
                    readonly type: "object";
                    readonly properties: {
                        readonly created_date: {
                            readonly type: "string";
                            readonly format: "date-time";
                        };
                        readonly closing_date: {
                            readonly type: "string";
                            readonly format: "date-time";
                        };
                        readonly listing_time: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly expiration_time: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly order_hash: {
                            readonly type: "string";
                        };
                        readonly protocol_data: {
                            readonly type: "object";
                            readonly properties: {
                                readonly parameters: {
                                    readonly type: "object";
                                    readonly additionalProperties: true;
                                };
                                readonly signature: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly protocol_address: {
                            readonly type: "string";
                        };
                        readonly current_price: {
                            readonly type: "string";
                        };
                        readonly maker: {
                            readonly type: "object";
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                                readonly profile_img_url: {
                                    readonly type: "string";
                                };
                                readonly config: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["address"];
                        };
                        readonly taker: {
                            readonly type: "object";
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                                readonly profile_img_url: {
                                    readonly type: "string";
                                };
                                readonly config: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["address"];
                        };
                        readonly maker_fees: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly account: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly basis_points: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["basis_points"];
                            };
                        };
                        readonly taker_fees: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly account: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly basis_points: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["basis_points"];
                            };
                        };
                        readonly side: {
                            readonly type: "string";
                        };
                        readonly order_type: {
                            readonly type: "string";
                        };
                        readonly cancelled: {
                            readonly type: "boolean";
                        };
                        readonly finalized: {
                            readonly type: "boolean";
                        };
                        readonly marked_invalid: {
                            readonly type: "boolean";
                        };
                        readonly remaining_quantity: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly maker_asset_bundle: {
                            readonly type: "object";
                            readonly properties: {
                                readonly assets: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "integer";
                                                readonly format: "int64";
                                                readonly minimum: -9223372036854776000;
                                                readonly maximum: 9223372036854776000;
                                            };
                                            readonly token_id: {
                                                readonly type: "string";
                                            };
                                            readonly num_sales: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly background_color: {
                                                readonly type: "string";
                                            };
                                            readonly image_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_preview_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_thumbnail_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly name: {
                                                readonly type: "string";
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                            };
                                            readonly external_link: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly chain_identifier: {
                                                        readonly type: "string";
                                                    };
                                                    readonly schema_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly asset_contract_type: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                            };
                                            readonly permalink: {
                                                readonly type: "string";
                                            };
                                            readonly collection: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly collection: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly description: {
                                                        readonly type: "string";
                                                    };
                                                    readonly image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly banner_image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly owner: {
                                                        readonly type: "string";
                                                    };
                                                    readonly safelist_status: {
                                                        readonly type: "string";
                                                    };
                                                    readonly category: {
                                                        readonly type: "string";
                                                    };
                                                    readonly is_disabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly is_nsfw: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly trait_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly collection_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly opensea_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly project_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly wiki_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly discord_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly telegram_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly twitter_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly instagram_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contracts: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly address: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly chain: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["address", "chain"];
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly token_metadata: {
                                                readonly type: "string";
                                            };
                                            readonly is_nsfw: {
                                                readonly type: "boolean";
                                            };
                                            readonly owner: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly profile_img_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly config: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address"];
                                            };
                                        };
                                        readonly required: readonly ["asset_contract", "token_id"];
                                    };
                                };
                                readonly maker: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly profile_img_url: {
                                            readonly type: "string";
                                        };
                                        readonly config: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address"];
                                };
                                readonly asset_contract: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly chain_identifier: {
                                            readonly type: "string";
                                        };
                                        readonly schema_name: {
                                            readonly type: "string";
                                        };
                                        readonly asset_contract_type: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                };
                                readonly slug: {
                                    readonly type: "string";
                                };
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly external_link: {
                                    readonly type: "string";
                                };
                                readonly permalink: {
                                    readonly type: "string";
                                };
                                readonly seaport_sell_orders: {
                                    readonly type: "array";
                                    readonly items: {};
                                };
                            };
                            readonly required: readonly ["assets"];
                        };
                        readonly taker_asset_bundle: {
                            readonly type: "object";
                            readonly properties: {
                                readonly assets: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "integer";
                                                readonly format: "int64";
                                                readonly minimum: -9223372036854776000;
                                                readonly maximum: 9223372036854776000;
                                            };
                                            readonly token_id: {
                                                readonly type: "string";
                                            };
                                            readonly num_sales: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly background_color: {
                                                readonly type: "string";
                                            };
                                            readonly image_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_preview_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_thumbnail_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly name: {
                                                readonly type: "string";
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                            };
                                            readonly external_link: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly chain_identifier: {
                                                        readonly type: "string";
                                                    };
                                                    readonly schema_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly asset_contract_type: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                            };
                                            readonly permalink: {
                                                readonly type: "string";
                                            };
                                            readonly collection: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly collection: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly description: {
                                                        readonly type: "string";
                                                    };
                                                    readonly image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly banner_image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly owner: {
                                                        readonly type: "string";
                                                    };
                                                    readonly safelist_status: {
                                                        readonly type: "string";
                                                    };
                                                    readonly category: {
                                                        readonly type: "string";
                                                    };
                                                    readonly is_disabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly is_nsfw: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly trait_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly collection_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly opensea_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly project_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly wiki_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly discord_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly telegram_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly twitter_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly instagram_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contracts: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly address: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly chain: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["address", "chain"];
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly token_metadata: {
                                                readonly type: "string";
                                            };
                                            readonly is_nsfw: {
                                                readonly type: "boolean";
                                            };
                                            readonly owner: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly profile_img_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly config: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address"];
                                            };
                                        };
                                        readonly required: readonly ["asset_contract", "token_id"];
                                    };
                                };
                                readonly maker: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly profile_img_url: {
                                            readonly type: "string";
                                        };
                                        readonly config: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address"];
                                };
                                readonly asset_contract: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly chain_identifier: {
                                            readonly type: "string";
                                        };
                                        readonly schema_name: {
                                            readonly type: "string";
                                        };
                                        readonly asset_contract_type: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                };
                                readonly slug: {
                                    readonly type: "string";
                                };
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly external_link: {
                                    readonly type: "string";
                                };
                                readonly permalink: {
                                    readonly type: "string";
                                };
                                readonly seaport_sell_orders: {
                                    readonly type: "array";
                                    readonly items: {};
                                };
                            };
                            readonly required: readonly ["assets"];
                        };
                    };
                    readonly required: readonly ["cancelled", "created_date", "current_price", "expiration_time", "finalized", "listing_time", "maker_fees", "marked_invalid", "order_hash", "order_type", "remaining_quantity", "side", "taker_fees"];
                };
            };
            readonly required: readonly ["order"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostOffer: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly parameters: {
                readonly type: "object";
                readonly properties: {
                    readonly offerer: {
                        readonly type: "string";
                    };
                    readonly zone: {
                        readonly type: "string";
                    };
                    readonly offer: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly itemType: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly token: {
                                    readonly type: "string";
                                };
                                readonly identifierOrCriteria: {
                                    readonly type: "string";
                                };
                                readonly startAmount: {
                                    readonly type: "string";
                                };
                                readonly endAmount: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "startAmount", "token"];
                        };
                    };
                    readonly consideration: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly itemType: {
                                    readonly type: "integer";
                                    readonly format: "int32";
                                    readonly minimum: -2147483648;
                                    readonly maximum: 2147483647;
                                };
                                readonly token: {
                                    readonly type: "string";
                                };
                                readonly identifierOrCriteria: {
                                    readonly type: "string";
                                };
                                readonly startAmount: {
                                    readonly type: "string";
                                };
                                readonly endAmount: {
                                    readonly type: "string";
                                };
                                readonly recipient: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["endAmount", "identifierOrCriteria", "itemType", "recipient", "startAmount", "token"];
                        };
                    };
                    readonly orderType: {
                        readonly type: "integer";
                        readonly format: "int32";
                        readonly minimum: -2147483648;
                        readonly maximum: 2147483647;
                    };
                    readonly startTime: {
                        readonly type: "string";
                    };
                    readonly endTime: {
                        readonly type: "string";
                    };
                    readonly zoneHash: {
                        readonly type: "string";
                    };
                    readonly salt: {
                        readonly type: "string";
                    };
                    readonly conduitKey: {
                        readonly type: "string";
                    };
                    readonly totalOriginalConsiderationItems: {
                        readonly type: "integer";
                        readonly format: "int32";
                        readonly minimum: -2147483648;
                        readonly maximum: 2147483647;
                    };
                    readonly counter: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["conduitKey", "consideration", "counter", "endTime", "offer", "offerer", "orderType", "salt", "startTime", "totalOriginalConsiderationItems", "zoneHash"];
            };
            readonly protocol_address: {
                readonly type: "string";
            };
            readonly signature: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["parameters", "protocol_address", "signature"];
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly protocol: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["chain", "protocol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly order: {
                    readonly type: "object";
                    readonly properties: {
                        readonly created_date: {
                            readonly type: "string";
                            readonly format: "date-time";
                        };
                        readonly closing_date: {
                            readonly type: "string";
                            readonly format: "date-time";
                        };
                        readonly listing_time: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly expiration_time: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly order_hash: {
                            readonly type: "string";
                        };
                        readonly protocol_data: {
                            readonly type: "object";
                            readonly properties: {
                                readonly parameters: {
                                    readonly type: "object";
                                    readonly additionalProperties: true;
                                };
                                readonly signature: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly protocol_address: {
                            readonly type: "string";
                        };
                        readonly current_price: {
                            readonly type: "string";
                        };
                        readonly maker: {
                            readonly type: "object";
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                                readonly profile_img_url: {
                                    readonly type: "string";
                                };
                                readonly config: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["address"];
                        };
                        readonly taker: {
                            readonly type: "object";
                            readonly properties: {
                                readonly address: {
                                    readonly type: "string";
                                };
                                readonly profile_img_url: {
                                    readonly type: "string";
                                };
                                readonly config: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["address"];
                        };
                        readonly maker_fees: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly account: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly basis_points: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["basis_points"];
                            };
                        };
                        readonly taker_fees: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly account: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly profile_img_url: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["address"];
                                    };
                                    readonly basis_points: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["basis_points"];
                            };
                        };
                        readonly side: {
                            readonly type: "string";
                        };
                        readonly order_type: {
                            readonly type: "string";
                        };
                        readonly cancelled: {
                            readonly type: "boolean";
                        };
                        readonly finalized: {
                            readonly type: "boolean";
                        };
                        readonly marked_invalid: {
                            readonly type: "boolean";
                        };
                        readonly remaining_quantity: {
                            readonly type: "integer";
                            readonly format: "int64";
                            readonly minimum: -9223372036854776000;
                            readonly maximum: 9223372036854776000;
                        };
                        readonly maker_asset_bundle: {
                            readonly type: "object";
                            readonly properties: {
                                readonly assets: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "integer";
                                                readonly format: "int64";
                                                readonly minimum: -9223372036854776000;
                                                readonly maximum: 9223372036854776000;
                                            };
                                            readonly token_id: {
                                                readonly type: "string";
                                            };
                                            readonly num_sales: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly background_color: {
                                                readonly type: "string";
                                            };
                                            readonly image_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_preview_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_thumbnail_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly name: {
                                                readonly type: "string";
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                            };
                                            readonly external_link: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly chain_identifier: {
                                                        readonly type: "string";
                                                    };
                                                    readonly schema_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly asset_contract_type: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                            };
                                            readonly permalink: {
                                                readonly type: "string";
                                            };
                                            readonly collection: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly collection: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly description: {
                                                        readonly type: "string";
                                                    };
                                                    readonly image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly banner_image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly owner: {
                                                        readonly type: "string";
                                                    };
                                                    readonly safelist_status: {
                                                        readonly type: "string";
                                                    };
                                                    readonly category: {
                                                        readonly type: "string";
                                                    };
                                                    readonly is_disabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly is_nsfw: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly trait_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly collection_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly opensea_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly project_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly wiki_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly discord_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly telegram_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly twitter_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly instagram_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contracts: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly address: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly chain: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["address", "chain"];
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly token_metadata: {
                                                readonly type: "string";
                                            };
                                            readonly is_nsfw: {
                                                readonly type: "boolean";
                                            };
                                            readonly owner: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly profile_img_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly config: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address"];
                                            };
                                        };
                                        readonly required: readonly ["asset_contract", "token_id"];
                                    };
                                };
                                readonly maker: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly profile_img_url: {
                                            readonly type: "string";
                                        };
                                        readonly config: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address"];
                                };
                                readonly asset_contract: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly chain_identifier: {
                                            readonly type: "string";
                                        };
                                        readonly schema_name: {
                                            readonly type: "string";
                                        };
                                        readonly asset_contract_type: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                };
                                readonly slug: {
                                    readonly type: "string";
                                };
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly external_link: {
                                    readonly type: "string";
                                };
                                readonly permalink: {
                                    readonly type: "string";
                                };
                                readonly seaport_sell_orders: {
                                    readonly type: "array";
                                    readonly items: {};
                                };
                            };
                            readonly required: readonly ["assets"];
                        };
                        readonly taker_asset_bundle: {
                            readonly type: "object";
                            readonly properties: {
                                readonly assets: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "integer";
                                                readonly format: "int64";
                                                readonly minimum: -9223372036854776000;
                                                readonly maximum: 9223372036854776000;
                                            };
                                            readonly token_id: {
                                                readonly type: "string";
                                            };
                                            readonly num_sales: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly background_color: {
                                                readonly type: "string";
                                            };
                                            readonly image_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_preview_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_thumbnail_url: {
                                                readonly type: "string";
                                            };
                                            readonly image_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_url: {
                                                readonly type: "string";
                                            };
                                            readonly animation_original_url: {
                                                readonly type: "string";
                                            };
                                            readonly name: {
                                                readonly type: "string";
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                            };
                                            readonly external_link: {
                                                readonly type: "string";
                                            };
                                            readonly asset_contract: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly chain_identifier: {
                                                        readonly type: "string";
                                                    };
                                                    readonly schema_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly asset_contract_type: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                            };
                                            readonly permalink: {
                                                readonly type: "string";
                                            };
                                            readonly collection: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly collection: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly description: {
                                                        readonly type: "string";
                                                    };
                                                    readonly image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly banner_image_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly owner: {
                                                        readonly type: "string";
                                                    };
                                                    readonly safelist_status: {
                                                        readonly type: "string";
                                                    };
                                                    readonly category: {
                                                        readonly type: "string";
                                                    };
                                                    readonly is_disabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly is_nsfw: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly trait_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly collection_offers_enabled: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly opensea_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly project_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly wiki_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly discord_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly telegram_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly twitter_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly instagram_username: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contracts: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly address: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly chain: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["address", "chain"];
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["collection", "collection_offers_enabled", "contracts", "is_disabled", "is_nsfw", "name", "opensea_url", "safelist_status", "trait_offers_enabled"];
                                            };
                                            readonly decimals: {
                                                readonly type: "integer";
                                                readonly format: "int32";
                                                readonly minimum: -2147483648;
                                                readonly maximum: 2147483647;
                                            };
                                            readonly token_metadata: {
                                                readonly type: "string";
                                            };
                                            readonly is_nsfw: {
                                                readonly type: "boolean";
                                            };
                                            readonly owner: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly profile_img_url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly config: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["address"];
                                            };
                                        };
                                        readonly required: readonly ["asset_contract", "token_id"];
                                    };
                                };
                                readonly maker: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly profile_img_url: {
                                            readonly type: "string";
                                        };
                                        readonly config: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address"];
                                };
                                readonly asset_contract: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly chain_identifier: {
                                            readonly type: "string";
                                        };
                                        readonly schema_name: {
                                            readonly type: "string";
                                        };
                                        readonly asset_contract_type: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["address", "asset_contract_type", "chain_identifier"];
                                };
                                readonly slug: {
                                    readonly type: "string";
                                };
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly external_link: {
                                    readonly type: "string";
                                };
                                readonly permalink: {
                                    readonly type: "string";
                                };
                                readonly seaport_sell_orders: {
                                    readonly type: "array";
                                    readonly items: {};
                                };
                            };
                            readonly required: readonly ["assets"];
                        };
                    };
                    readonly required: readonly ["cancelled", "created_date", "current_price", "expiration_time", "finalized", "listing_time", "maker_fees", "marked_invalid", "order_hash", "order_type", "remaining_quantity", "side", "taker_fees"];
                };
            };
            readonly required: readonly ["order"];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const RefreshNftMetadata1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Contract address";
                };
                readonly chain: {
                    readonly type: "string";
                    readonly description: "The blockchain on which to filter the results";
                    readonly enum: readonly ["blast", "base", "ethereum", "zora", "arbitrum", "sei", "avalanche", "polygon", "optimism", "ape_chain", "flow", "b3", "soneium", "ronin", "bera_chain", "solana", "shape", "unichain", "gunzilla", "abstract", "immutable", "hyperevm", "somnia", "monad", "hyperliquid", "megaeth"];
                    readonly examples: readonly ["ethereum"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly identifier: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Token identifier";
                };
            };
            readonly required: readonly ["address", "chain", "identifier"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly ignoreCachedItemUrls: {
                    readonly type: "boolean";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "string";
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { BuildOfferV2, CancelOrder1, GenerateListingFulfillmentDataV21, GenerateOfferFulfillmentDataV2, GetAccount, GetBestListingNft, GetBestListingsCollection, GetBestOfferNft1, GetCollection, GetCollectionStats, GetCollectionTraits, GetContract, GetListings1, GetNft1, GetNftMetadata, GetNftsByAccount, GetNftsByCollection, GetNftsByContract1, GetOffers, GetOffersCollection, GetOffersCollectionTrait1, GetOffersNft1, GetOrder1, GetPaymentToken, ListCollections, ListEvents1, ListEventsByAccount1, ListEventsByCollection, ListEventsByNft1, ListListingsCollectionAll1, ListOffersCollectionAll1, PostCriteriaOfferV2, PostListing1, PostOffer, RefreshNftMetadata1 };
