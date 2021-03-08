const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;

    next();
  }
  if (!foundDish) {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }
  next();
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function dishHasCorrectBody(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;

  if (!name) {
    next({
      status: 400,
      message: `Dish must include a name`,
    });
  }

  if (!description) {
    next({
      status: 400,
      message: `Dish must include a description`,
    });
  }

  if (!price) {
    next({
      status: 400,
      message: `Dish must include a price`,
    });
  }

  if (price < 0 || typeof price !== "number") {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  if (!image_url) {
    next({
      status: 400,
      message: `Dish must include a image_url`,
    });
  }
  next();
}

function create(req, res) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishUpdateValidation(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const dish = res.locals.dish;
  if (id) {
    if (id !== dish.id) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dish.id}`,
      });
    }
  }
  next();
}

function update(req, res) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const dish = res.locals.dish;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  create: [dishHasCorrectBody, create],
  read: [dishExists, read],
  update: [dishExists, dishHasCorrectBody, dishUpdateValidation, update],
  list,
};
