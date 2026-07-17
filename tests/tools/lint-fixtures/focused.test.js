describe.only("focused fixture", function () {
  it.skip("disabled fixture", function () {});
});

it.skip.each([[1]])("disabled table fixture", function () {});
it["skip"]("computed disabled fixture", function () {});
test.todo("todo fixture");
describe.concurrent.only("chained focused fixture", function () {});
