# Tokenized Certificate Issuance Flow

---

## 1. Login

The educator connects their wallet (MetaMask). The frontend takes the wallet address and sends it to the backend. The backend verifies that the wallet exists in the database, returns a JWT, and stores it in the browser. Since the role is `issuer`, the user is redirected directly to the Educator Dashboard.

---

## 2. Educator Dashboard starts

The first thing the dashboard does is ask the backend **"who am I?"** using the stored JWT. The backend reads the wallet from the token, looks it up in the issuers table, and responds with the organization name, wallet, and educator email. At the same time, it loads the list of all registered students to display them in the form.

---

## 3. The educator fills out the form

They select a student from the dropdown (which already includes their name and wallet), enter the course title, date, issuer name, and upload a logo. As they fill in the fields, an **animated preview** of the certificate updates in real time on the right.

---

## 4. Click on "Create Certificate"

This is where the chain of operations begins:

### 4.1 Image → IPFS

The certificate image is uploaded to Pinata and returns a **CID** — the permanent address of the file on IPFS.

### 4.2 Metadata → IPFS

With that CID, the backend builds a JSON with the certificate data (student name, course, educator wallet as professor, date, and image) and also uploads it to Pinata. This JSON is what the NFT will reference forever.

```json
{
    "name": "Certificate for Emmanuel Pastor",
    "description": "HackChain Tokenized Certificate",
    "image": "ipfs://bafkreidqdnjdv2w2nsmhmzq43ezqaywuhtsvzj7ldwgrf3ly5khjhu5774",
    "attributes": [
        {
            "trait_type": "Student",
            "value": "Emmanuel Pastor"
        },
        {
            "trait_type": "Course",
            "value": "Introduction to Burpsuite"
        },
        {
            "trait_type": "Professor",
            "value": "Red Linuxera"
        },
        {
            "trait_type": "Date",
            "value": "2026-02-09"
        }
    ]
}
```

### 4.3 Validation

Before spending gas on the blockchain, the backend verifies that both the student’s wallet and the educator’s wallet exist in the database. If anything fails here, the process stops.

### 4.4 Minting on Polygon

The frontend calls the smart contract with the student’s wallet and the metadata URI. The educator **signs the transaction from their wallet**, which cryptographically proves authorization. The contract assigns the next available number as `tokenId`, transfers the NFT directly to the student’s wallet, and records the metadata link in a **permanent and immutable** way.

### 4.5 Database record

Once the `txHash` and `tokenId` are confirmed by the blockchain, the backend stores the certificate in the database as a mirror of the on-chain state.

### 4.6 Counter

The counter of certificates issued by that educator is incremented by 1, and it is displayed in their dashboard profile.

---

## 5. The student opens their dashboard

The student connects their wallet. The backend looks it up in the students table, confirms it exists, returns a JWT, and redirects them to the Talent Dashboard. With that token, the dashboard asks **"who am I?"** and retrieves the student’s name and wallet.

---

## 6. Their certificates appear

Using the student’s wallet, the backend queries the OpenSea API, retrieves all NFTs they own in the HackChain collection, and sorts them **from newest to oldest**.

---

## 7. The student views and shares their certificate

Each certificate appears as a card with its image. A **"View on OpenSea"** button opens the NFT page directly, where the student can see the full metadata, transaction history, and share it as verifiable proof of their achievement.

---

## Visual summary

```
[EDUCATOR]
    │
    ├─ 1. Connects wallet → JWT → Educator Dashboard
    ├─ 2. Dashboard loads profile + student list
    ├─ 3. Fills form → real-time preview
    └─ 4. Create Certificate
            ├─ Image   ──────────────────► Pinata IPFS   → image CID
            ├─ Metadata ─────────────────► Pinata IPFS   → tokenURI
            ├─ Validation ───────────────► Database      → wallets exist?
            ├─ Minting ──────────────────► Polygon       → tokenId + txHash
            ├─ Record ───────────────────► Database      → certificate stored
            └─ Counter ──────────────────► Database      → certificates_issued++

[STUDENT]
    │
    ├─ 5. Connects wallet → JWT → Talent Dashboard
    ├─ 6. Dashboard queries NFTs → OpenSea API → filters HackChain collection
    └─ 7. Views certificates → "View on OpenSea" button
```
