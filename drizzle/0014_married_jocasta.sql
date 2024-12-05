ALTER TABLE "orders" ADD COLUMN "price" integer;

UPDATE orders
SET price = subquery.total_price
FROM (
  SELECT o.id AS order_id, o.total_hours, t.hourly_rate, (o.total_hours * t.hourly_rate) AS total_price
  FROM orders o
  JOIN tutories t ON t.id = o."tutoriesId"
) AS subquery
WHERE orders.id = subquery.order_id;

ALTER TABLE "orders" ALTER COLUMN "price" SET NOT NULL;