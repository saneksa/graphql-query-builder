describe("GraphQL Query Builder", () => {
  const {
    GraphQlQuery,
    enumValue,
  }: {
    GraphQlQuery: gql.GraphQlQueryFactory;
    enumValue: (string) => gql.EnumValue;
  } = require("../src/GraphQlQuery");

  describe("product", () => {
    it("should include product", () => {
      const query = new GraphQlQuery("product");
      expect(query.toString()).toEqual("{ product{} }");
    });

    it("should support alias for product", () => {
      const query = new GraphQlQuery({ alias: "product" });
      expect(query.toString()).toEqual("{ alias: product{} }");
    });

    it("should support arguments for product", () => {
      const query = new GraphQlQuery(
        { alias: "product" },
        { attr1: "value1", attr2: 2, attr3: true }
      );
      expect(query.toString()).toEqual(
        '{ alias: product(attr1: "value1", attr2: 2, attr3: true){} }'
      );
    });

    it("should support nested filtering", () => {
      const query = new GraphQlQuery("product", {
        attr1: { attr2: { attr3: { attr4: "val" } } },
      });
      expect(query.toString()).toEqual(
        '{ product(attr1: {attr2: {attr3: {attr4: "val"}}}){} }'
      );
    });

    it("should handle empty arguments", () => {
      const query = new GraphQlQuery("product", {});
      expect(query.toString()).toEqual("{ product{} }");
    });
  });

  describe("enum value", () => {
    it("should return value set on toString", () => {
      const type = "text";
      expect(enumValue(type).toString()).toEqual(type);
    });

    it("should filter without quotes", () => {
      const query = new GraphQlQuery("domain").filter({
        key: enumValue("value"),
      });
      expect(query.toString()).toEqual("{ domain(key: value){} }");
    });

    //TODO test nested
  });

  describe("filter", () => {
    it("should support filter product", () => {
      const query = new GraphQlQuery("product");
      query.filter({ attr1: "value1", attr2: 2, attr3: true });
      expect(query.toString()).toEqual(
        '{ product(attr1: "value1", attr2: 2, attr3: true){} }'
      );
    });

    it("should allow filter multiple times", () => {
      const query = new GraphQlQuery("product");
      query
        .filter({ attr1: "value1" })
        .filter({ attr2: 2, attr3: true })
        .filter({ attr1: "value2" });
      expect(query.toString()).toEqual(
        '{ product(attr1: "value2", attr2: 2, attr3: true){} }'
      );
    });

    it("should support nested filtering with regular filtering", () => {
      const query = new GraphQlQuery("product").filter({
        attr1: { attr2: "val1" },
        attr3: "val2",
      });
      expect(query.toString()).toEqual(
        '{ product(attr1: {attr2: "val1"}, attr3: "val2"){} }'
      );
    });
  });

  describe("select", () => {
    it("should support fields selection", () => {
      const query = new GraphQlQuery("product").select("id", "name");
      expect(query.toString()).toEqual("{ product{id name} }");
    });

    it("should support fields selection with alias", () => {
      const query = new GraphQlQuery("product").select(
        { productId: "id" },
        "name",
        { price: "productPrice" }
      );
      expect(query.toString()).toEqual(
        "{ product{productId: id name price: productPrice} }"
      );
    });

    it("should support fields selection with arguments", () => {
      const query = new GraphQlQuery("product").select(
        { productId: "id" },
        "name",
        { price: "productPrice", _filter: { discounted: true } }
      );
      expect(query.toString()).toEqual(
        "{ product{productId: id name price: productPrice(discounted: true)} }"
      );
    });

    it("should support selection of a Query", () => {
      const mainMedia = new GraphQlQuery("media").select("url");
      const product = new GraphQlQuery("product", {
        productId: "f150b16a-79ef-ef81-50f9-22e2df631822",
      }).select("id", "name", mainMedia);
      expect(product.toString()).toEqual(
        '{ product(productId: "f150b16a-79ef-ef81-50f9-22e2df631822"){id name media{url}} }'
      );
    });

    it("should support selection of a Query with alias", () => {
      const mainMedia = new GraphQlQuery("media").select("url");
      const product = new GraphQlQuery("product", {
        productId: "f150b16a-79ef-ef81-50f9-22e2df631822",
      }).select("id", "name", { image: mainMedia });
      expect(product.toString()).toEqual(
        '{ product(productId: "f150b16a-79ef-ef81-50f9-22e2df631822"){id name image: media{url}} }'
      );
    });
  });

  describe("without body", () => {
    it("should support query without filters", () => {
      const query = new GraphQlQuery("product").withoutBody();
      expect(query.toString()).toEqual("{ product }");
    });

    it("should support query with filters", () => {
      const query = new GraphQlQuery("product")
        .withoutBody()
        .filter({ attr1: "value1", attr2: 2, attr3: true });
      expect(query.toString()).toEqual(
        '{ product(attr1: "value1", attr2: 2, attr3: true) }'
      );
    });

    it("should not have body even with select", () => {
      const query = new GraphQlQuery("product")
        .withoutBody()
        .select("id", "name");
      expect(query.toString()).toEqual("{ product }");
    });
  });

  describe("join", () => {
    it("should support joining 2 queries", () => {
      const mainMedia = new GraphQlQuery("media").select("url");

      const query1 = new GraphQlQuery("product").select(
        { productId: "id" },
        "name",
        { price: "productPrice", _filter: { discounted: true } }
      );
      const query2 = new GraphQlQuery("order").select("id", {
        totalValue: "total",
      });

      const finalQuery = query1.join(query2);
      expect(finalQuery.toString()).toEqual(
        "{ product{productId: id name price: productPrice(discounted: true)} order{id totalValue: total} }"
      );
    });

    it("should throw exception when selecting on join query", () => {
      const query1 = new GraphQlQuery("product").select(
        { productId: "id" },
        "name",
        { price: "productPrice", _filter: { discounted: true } }
      );
      const query2 = new GraphQlQuery("order").select("id", {
        totalValue: "total",
      });
      const finalQuery = query1.join(query2);
      expect(finalQuery.select.bind(finalQuery, "1")).toThrow(Error);
    });

    it("should throw exception when calling without body on join query", () => {
      const query1 = new GraphQlQuery("product").select(
        { productId: "id" },
        "name",
        { price: "productPrice", _filter: { discounted: true } }
      );
      const query2 = new GraphQlQuery("order").select("id", {
        totalValue: "total",
      });
      const finalQuery = query1.join(query2);
      expect(finalQuery.withoutBody.bind(finalQuery)).toThrow(Error);
    });

    it("should support joining queries without body with select and with filters", () => {
      const query1 = new GraphQlQuery("product").withoutBody();
      const query2 = new GraphQlQuery("order").select("id", {
        totalValue: "total",
      });
      const query3 = new GraphQlQuery("order").filter({
        attr1: "value1",
        attr2: 2,
        attr3: true,
      });
      const finalQuery = query1.join(query2, query3);
      expect(finalQuery.toString()).toEqual(
        '{ product order{id totalValue: total} order(attr1: "value1", attr2: 2, attr3: true){} }'
      );
    });
  });
});
