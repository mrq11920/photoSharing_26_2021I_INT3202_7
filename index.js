"use strict";
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
let isDebug = true;

const {
  db,
  aql
} = require("@arangodb");
const collectionNameAccount = module.context.collectionName("account");
const collectionNameImageData = module.context.collectionName("imagedata");
const collectionNameImage = module.context.collectionName("image");
// const collectionNameAccount = module.context.collectionName("account");
// const collectionNameAccount = module.context.collectionName("account");


if (!db._collection(collectionNameAccount)) {
  db._createDocumentCollection(collectionNameAccount);
}
let accountCollection = db._collection(collectionNameAccount);

if (!db._collection(collectionNameImageData)) {
  db._createDocumentCollection(collectionNameImageData);
}
let imagedataCollection = db._collection(collectionNameImageData);


if (!db._collection(collectionNameImage)) {
  db._createDocumentCollection(collectionNameImage);
}
let imageCollection = db._collection(collectionNameImage);


module.context.use(router);
router.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

router.get('/hello-world', function (req, res) {
    res.send('Hello World!');
  })
  .response(['text/plain'], 'A generic greeting.')
  .summary('Generic greeting')
  .description('Prints a generic greeting.');

const joi = require('joi');

// router.use()

router.get('/hello/:name', function (req, res) {
    res.send(`Hello ${req.pathParams.name}`);
  })
  .pathParam('name', joi.string().required(), 'Name to greet.')
  .response(['text/plain'], 'A personalized greeting.')
  .summary('Personalized greeting')
  .description('Prints a personalized greeting.');


router.post('/sum', function (req, res) {
    const values = req.body.values;
    res.send({
      result: values.reduce(function (a, b) {
        return a + b;
      }, 0)
    });
  })
  .body(joi.object({
    values: joi.array().items(joi.number().required()).required()
  }).required(), 'Values to add together.')
  .response(joi.object({
    result: joi.number().required()
  }).required(), 'Sum of the input values.')
  .summary('Add up numbers')
  .description('Calculates the sum of an array of number values.');



router.post('/upload-image', function (req, res) {
    let _imageDataUrl = req.body.imgDataUrl;
    let _title = req.body.title;
    let _tags = req.body.tags;
    if (isDebug) console.log("image data Url -->  " + _imageDataUrl);
    if (isDebug) console.log("title -> " + _title);
    if (isDebug) console.log("/upload-image --> " + JSON.stringify(_tags));
    let _imgDataStatus = imagedataCollection.save({
      data_url: _imageDataUrl
    });
    if (_imgDataStatus) {

      let _imageStatus = imageCollection.save({
        title: _title,
        data_id: _imgDataStatus._key,
        tags: _tags,
        creationtime: new Date().getTime()
      });

      if (_imageStatus) {

        res.send({
          description: `inserted image to server return id ${_imageStatus._key}`,
          status: true
        });

      } else {

        res.send({
          description: "can not insert image info",
          status: false
        });

      }

      console.log("/upload-image image_id --> " + _imageStatus._key);

    } else {
      res.send({
        description: "can not insert dataURL",
        status: false
      });
    }

  })
  .body(joi.object({
    title: joi.string().required(),
    imgDataUrl: joi.string().required(),
    tags: joi.array().items(joi.string()),

  }).required(), 'image post to server in form of dataUrl')
  .response(joi.object({
    status: joi.boolean().required(),
    description: joi.string().required()
  }).required())
  .summary('upload image from user to server')
  .description('Parse dataUrl image and save it to a collection.');

router.get('/get-image-data/:ID', function (req, res) {
    // db.collection.document("<document-key>");
    // db._document("<document-id>");
    let _ID = req.pathParams.ID;
    if (isDebug) console.log('/get-image-data/:ID| ID --> ' + _ID);
    var _imageDataDocument = imagedataCollection.document(_ID);
    if (_imageDataDocument) {
      if (isDebug) console.log('/get-image-data/:ID| found ID --> ' + _ID);
      res.send(_imageDataDocument);
    } else {
      res.send({
        status: false,
        description: "does not found imageID"
      })
    }
    // res.send(imgData);
  })
  .pathParam('ID', joi.string().required(), 'ImageID to get.')
  .response(joi.object({
    "data_url": joi.string().required()
  }).required())
  .summary('Get image from server')
  .description('Use imageId in paramPath to get exact image on server');

router.get('/get-image-info/:start', function (req, res) {
    let _startIndex = req.pathParams.start;
    console.log('startIndex --> ' + _startIndex);
    const query = aql `FOR img IN ${imageCollection} 
      LIMIT ${_startIndex}, 25 
      RETURN img`;
    let _imageInfos = db._query(query).toArray();
    console.log(_imageInfos);
    res.send(_imageInfos);
  })
  .pathParam('start', joi.number().required(), 'start index')
  .response(joi.object({}).required())
  .summary('get about 25 image info')
  .description('use this to get 25 info and use that info to get more image!');

// FOR u IN users
// SORT u.firstName, u.lastName, u.id DESC
// LIMIT 2, 5
// RETURN u