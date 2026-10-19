INSERT INTO "CollectionProduct" ("id","collectionId","productId")
SELECT gen_random_uuid()::text, "collectionId", "id"
FROM "Product" WHERE "collectionId" IS NOT NULL
ON CONFLICT DO NOTHING;
