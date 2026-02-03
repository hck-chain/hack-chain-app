"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'opensea/2.0.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Get all offers for a specific item.
     *
     * @summary Get Item Offers
     */
    SDK.prototype.get_offers = function (metadata) {
        return this.core.fetch('/api/v2/orders/{chain}/{protocol}/offers', 'get', metadata);
    };
    /**
     * Create an offer to purchase a single NFT (ERC721 or ERC1155).
     *
     * @summary Create Item Offer
     */
    SDK.prototype.post_offer = function (body, metadata) {
        return this.core.fetch('/api/v2/orders/{chain}/{protocol}/offers', 'post', body, metadata);
    };
    /**
     * Get all listings for a specific item.
     *
     * @summary Get Listings
     */
    SDK.prototype.get_listings_1 = function (metadata) {
        return this.core.fetch('/api/v2/orders/{chain}/{protocol}/listings', 'get', metadata);
    };
    /**
     * List a single NFT (ERC721 or ERC1155) for sale on the OpenSea marketplace.
     *
     * @summary Create Listing
     */
    SDK.prototype.post_listing_1 = function (body, metadata) {
        return this.core.fetch('/api/v2/orders/{chain}/{protocol}/listings', 'post', body, metadata);
    };
    SDK.prototype.cancel_order_1 = function (body, metadata) {
        return this.core.fetch('/api/v2/orders/chain/{chain}/protocol/{protocol_address}/{order_hash}/cancel', 'post', body, metadata);
    };
    /**
     * Retrieve all the information, including signatures, needed to fulfill an offer directly
     * onchain.
     *
     * @summary Fulfill Offer
     * @throws FetchError<400, types.GenerateOfferFulfillmentDataV2Response400> The request is invalid
     * The order_hash does not exist
     * The chain is not an EVM Chain
     * The protocol_address is not a supported Seaport contract
     * For other error reasons, see the response data.
     */
    SDK.prototype.generate_offer_fulfillment_data_v2 = function (body) {
        return this.core.fetch('/api/v2/offers/fulfillment_data', 'post', body);
    };
    /**
     * Build a portion of a criteria offer including the merkle tree needed to post an offer.
     *
     * @summary Build Criteria Offer
     */
    SDK.prototype.build_offer_v2 = function (body) {
        return this.core.fetch('/api/v2/offers/build', 'post', body);
    };
    /**
     * Create a criteria offer to purchase any NFT in a collection or which matches the
     * specified trait.
     *
     * @summary Create Criteria Offer
     */
    SDK.prototype.post_criteria_offer_v2 = function (body) {
        return this.core.fetch('/api/v2/offers', 'post', body);
    };
    /**
     * Retrieve all the information, including signatures, needed to fulfill a listing directly
     * onchain.
     *
     * @summary Fulfill Listing
     * @throws FetchError<400, types.GenerateListingFulfillmentDataV21Response400> The request is invalid
     * The order_hash does not exist
     * The chain is not an EVM Chain
     * The protocol_address is not a supported Seaport contract
     * For other error reasons, see the response data.
     */
    SDK.prototype.generate_listing_fulfillment_data_v2_1 = function (body) {
        return this.core.fetch('/api/v2/listings/fulfillment_data', 'post', body);
    };
    /**
     * Queue a metadata refresh for a specific NFT to update its information from the
     * blockchain.
     *
     * @summary Refresh NFT metadata
     */
    SDK.prototype.refresh_nft_metadata_1 = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/contract/{address}/nfts/{identifier}/refresh', 'post', metadata);
    };
    /**
     * Get all available traits for a collection with their value counts and data types.
     *
     * @summary Get collection traits
     */
    SDK.prototype.get_collection_traits = function (metadata) {
        return this.core.fetch('/api/v2/traits/{slug}', 'get', metadata);
    };
    /**
     * Get a single order by its order hash.
     *
     * @summary Get Order
     */
    SDK.prototype.get_order_1 = function (metadata) {
        return this.core.fetch('/api/v2/orders/chain/{chain}/protocol/{protocol_address}/{order_hash}', 'get', metadata);
    };
    /**
     * Get trait offers for a collection with the specified trait(s). Supports single or
     * multiple traits.
     *
     * @summary Get offers (by trait)
     */
    SDK.prototype.get_offers_collection_trait_1 = function (metadata) {
        return this.core.fetch('/api/v2/offers/collection/{slug}/traits', 'get', metadata);
    };
    /**
     * Get the best offer for an NFT.
     *
     * @summary Get best offer (by NFT)
     */
    SDK.prototype.get_best_offer_nft_1 = function (metadata) {
        return this.core.fetch('/api/v2/offers/collection/{slug}/nfts/{identifier}/best', 'get', metadata);
    };
    /**
     * Get offers for an NFT.
     *
     * @summary Get offers (by NFT)
     */
    SDK.prototype.get_offers_nft_1 = function (metadata) {
        return this.core.fetch('/api/v2/offers/collection/{slug}/nfts/{identifier}', 'get', metadata);
    };
    /**
     * Get all offers for a collection.
     *
     * @summary Get all offers (by collection)
     */
    SDK.prototype.list_offers_collection_all_1 = function (metadata) {
        return this.core.fetch('/api/v2/offers/collection/{slug}/all', 'get', metadata);
    };
    /**
     * Get collection offers on a collection.
     *
     * @summary Get offers (by collection)
     */
    SDK.prototype.get_offers_collection = function (metadata) {
        return this.core.fetch('/api/v2/offers/collection/{slug}', 'get', metadata);
    };
    /**
     * Get detailed metadata for an NFT including name, description, image, traits, and
     * external links.
     *
     * @summary Get NFT metadata
     */
    SDK.prototype.get_nft_metadata = function (metadata) {
        return this.core.fetch('/api/v2/metadata/{chain}/{contractAddress}/{tokenId}', 'get', metadata);
    };
    /**
     * Get the best listing for an NFT.
     *
     * @summary Get best listing (by NFT)
     */
    SDK.prototype.get_best_listing_nft = function (metadata) {
        return this.core.fetch('/api/v2/listings/collection/{slug}/nfts/{identifier}/best', 'get', metadata);
    };
    /**
     * Get the best listings for a collection by price.
     *
     * @summary Get best listings (by collection)
     */
    SDK.prototype.get_best_listings_collection = function (metadata) {
        return this.core.fetch('/api/v2/listings/collection/{slug}/best', 'get', metadata);
    };
    /**
     * Get all listings for a collection.
     *
     * @summary Get all listings (by collection)
     */
    SDK.prototype.list_listings_collection_all_1 = function (metadata) {
        return this.core.fetch('/api/v2/listings/collection/{slug}/all', 'get', metadata);
    };
    /**
     * Get a list of events for a collection.
     *
     * @summary Get events (by collection)
     */
    SDK.prototype.list_events_by_collection = function (metadata) {
        return this.core.fetch('/api/v2/events/collection/{slug}', 'get', metadata);
    };
    /**
     * Get a list of events for a specific NFT.
     *
     * @summary Get events (by NFT)
     */
    SDK.prototype.list_events_by_nft_1 = function (metadata) {
        return this.core.fetch('/api/v2/events/chain/{chain}/contract/{address}/nfts/{identifier}', 'get', metadata);
    };
    /**
     * Get a list of events for an account.
     *
     * @summary Get events (by account)
     */
    SDK.prototype.list_events_by_account_1 = function (metadata) {
        return this.core.fetch('/api/v2/events/accounts/{address}', 'get', metadata);
    };
    /**
     * Get a list of events, with optional filtering by event type and time range.
     *
     * @summary Get events
     */
    SDK.prototype.list_events_1 = function (metadata) {
        return this.core.fetch('/api/v2/events', 'get', metadata);
    };
    /**
     * Get a list of collections with filters and sorting options.
     *
     * @summary Get multiple collections
     */
    SDK.prototype.list_collections = function (metadata) {
        return this.core.fetch('/api/v2/collections', 'get', metadata);
    };
    /**
     * Get a single collection including details such as fees, traits, and links.
     *
     * @summary Get a single collection
     */
    SDK.prototype.get_collection = function (metadata) {
        return this.core.fetch('/api/v2/collections/{slug}', 'get', metadata);
    };
    /**
     * Get comprehensive statistics for a collection including volume, floor price, and trading
     * metrics.
     *
     * @summary Get collection stats
     */
    SDK.prototype.get_collection_stats = function (metadata) {
        return this.core.fetch('/api/v2/collections/{slug}/stats', 'get', metadata);
    };
    /**
     * Get all NFTs in a specific collection.
     *
     * @summary Get NFTs by collection
     */
    SDK.prototype.get_nfts_by_collection = function (metadata) {
        return this.core.fetch('/api/v2/collection/{slug}/nfts', 'get', metadata);
    };
    /**
     * Get a payment token by chain and contract address.
     *
     * @summary Get payment token
     */
    SDK.prototype.get_payment_token = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/payment_token/{address}', 'get', metadata);
    };
    /**
     * Get contract metadata including collection information, contract standards, and
     * ownership details.
     *
     * @summary Get contract
     */
    SDK.prototype.get_contract = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/contract/{address}', 'get', metadata);
    };
    /**
     * Get metadata, traits, ownership information, and rarity for a single NFT.
     *
     * @summary Get NFT
     */
    SDK.prototype.get_nft_1 = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/contract/{address}/nfts/{identifier}', 'get', metadata);
    };
    /**
     * Get all NFTs for a specific contract address on a blockchain.
     *
     * @summary Get NFTs by contract
     */
    SDK.prototype.get_nfts_by_contract_1 = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/contract/{address}/nfts', 'get', metadata);
    };
    /**
     * Get all NFTs owned by a specific account on a blockchain, with optional collection
     * filtering.
     *
     * @summary Get NFTs by account
     */
    SDK.prototype.get_nfts_by_account = function (metadata) {
        return this.core.fetch('/api/v2/chain/{chain}/account/{address}/nfts', 'get', metadata);
    };
    /**
     * Get an OpenSea Account Profile including details such as bio, social media usernames,
     * and profile image.
     *
     * @summary Get an OpenSea Account Profile
     */
    SDK.prototype.get_account = function (metadata) {
        return this.core.fetch('/api/v2/accounts/{address_or_username}', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
