"use strict";
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
let isDebug = true;

const {
  db,
  aql
} = require("@arangodb");
// const collectionNameAccount = module.context.collectionName("account");
const collectionNameImageData = module.context.collectionName("imagedata");
const collectionNameImage = module.context.collectionName("image");
const collectionNameTags = module.context.collectionName("tags");
const collectionAccount = module.context.collectionName('account')
// const collectionNameAccount = module.context.collectionName("account");


// if (!db._collection(collectionNameAccount)) {
//   db._createDocumentCollection(collectionNameAccount);
// }
// let accountCollection = db._collection(collectionNameAccount);

if (!db._collection(collectionNameImageData)) {
  db._createDocumentCollection(collectionNameImageData);
}
let imagedataCollection = db._collection(collectionNameImageData);

if (!db._collection(collectionNameImage)) {
  db._createDocumentCollection(collectionNameImage);
}
let imageCollection = db._collection(collectionNameImage);

if (!db._collection(collectionNameTags)) {
  db._createDocumentCollection(collectionNameTags);
}
let tagsCollection = db._collection(collectionNameTags);

if (!db._collection(collectionAccount)) {
  db._createDocumentCollection(collectionAccount);
}
let accountCollection = db._collection(collectionAccount);

tagsCollection.ensureIndex({
  type: "persistent",
  fields: ["tag_name"],
  unique: true,
  sparse: true
});
tagsCollection.ensureIndex({
  type: "fulltext",
  fields: ["tag_name"],
  unique: true,
  sparse: true
})

module.context.use(router);
router.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const joi = require('joi');

// router.get('/hello-world', function (req, res) {
//     res.send('Hello World!');
//   })
//   .response(['text/plain'], 'A generic greeting.')
//   .summary('Generic greeting')
//   .description('Prints a generic greeting.');


// // router.use()

// router.get('/hello/:name', function (req, res) {
//     res.send(`Hello ${req.pathParams.name}`);
//   })
//   .pathParam('name', joi.string().required(), 'Name to greet.')
//   .response(['text/plain'], 'A personalized greeting.')
//   .summary('Personalized greeting')
//   .description('Prints a personalized greeting.');


// router.post('/sum', function (req, res) {
//     const values = req.body.values;
//     res.send({
//       result: values.reduce(function (a, b) {
//         return a + b;
//       }, 0)
//     });
//   })
//   .body(joi.object({
//     values: joi.array().items(joi.number().required()).required()
//   }).required(), 'Values to add together.')
//   .response(joi.object({
//     result: joi.number().required()
//   }).required(), 'Sum of the input values.')
//   .summary('Add up numbers')
//   .description('Calculates the sum of an array of number values.');
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function checkUsernameInDatabase(username) {
  let checkExistUsername = aql `FOR account in ${accountCollection}
                    FILTER account.username == ${username}
                    return account`
  let _checkExistStatus = db._query(checkExistUsername).toArray();
  console.log('fucntion checkUsernameInDatabase empty mean false');
  console.log(_checkExistStatus)
  if (JSON.stringify(_checkExistStatus).includes('username')) return _checkExistStatus[0];
  else return false;
}
router.post('/signup', function (req, res) {
    if (isDebug) console.log('/signup | body --> email: ' + req.body.email + ', username: ' + req.body.username + ', password: ' + req.body.password);
    var usernameRegex = /^[a-zA-Z0-9]+$/;
    var isusernameValid = usernameRegex.test(req.body.username);
    console.log('/signup | isusernameValid --> ' + isusernameValid);
    var isemailValid = validateEmail(req.body.email);
    console.log('/signup | isemailValid --> ' + isemailValid);
    if (isusernameValid && isemailValid) {
      // check for
      var _exist = checkUsernameInDatabase(req.body.username);
      if (!_exist) {
        var _status = accountCollection.save({
          email: req.body.email,
          username: req.body.username,
          password: req.body.password
        });
        res.send(JSON.stringify(_status));
      } else {
        res.send({
          status: false,
          description: "username already existed"
        })
      }
    } else {
      res.send({
        status: false,
        description: "username or email is invalid!"
      })
    }
  })
  .body(joi.object({
    email: joi.string().required(),
    username: joi.string().required(),
    password: joi.string().required()
  }).required(), 'json of a account')
  .response(joi.object({
    status: joi.boolean().required(),
    description: joi.string().required()
  }).required())
  .summary('signup API')
  .description('Validate username and email if success then add it to database else return error');

router.post("/login", function (req, res) {
    var _exist = checkUsernameInDatabase(req.body.username);
    console.log('/login | ');
    if (isDebug) console.log('username --> ' + req.body.username + ', password --> ' + req.body.password);
    console.log(_exist);
    if (_exist && _exist.password == req.body.password) {
      res.send({
        status: true,
        description: "login successfully"
      })
    } else
      res.send({
        status: false,
        description: "username or password is wrong"
      })
  })
  .body(joi.object({
    username: joi.string().required(),
    password: joi.string().required()
  }).required(), 'username and password')
  .response(joi.object({
    status: joi.boolean().required(),
    description: joi.string().required()
  }).required())
  .summary('login API')
  .description('check for username and check password for login');

router.post('/remove-image-by-data-id', function (req, res) {
    var _data_id = req.body.data_id;
    console.log('/remove-image-by-data-id ---------------------');
    if (_data_id) {
      let removeImageInfoQuery = aql `FOR image in ${imageCollection}
    FILTER image.data_id == ${_data_id}
    REMOVE image in ${imageCollection}
    return removed`;
      let _removeImageInfoStatus = db._query(removeImageInfoQuery).toArray();
      if (isDebug) console.log('/remove-image-by-data-id |_removeImageInfoStatus --> ' + _removeImageInfoStatus);
      if (JSON.stringify(_removeImageInfoStatus).includes('tags')) {
        var _tags = _removeImageInfoStatus.tags;
        console.log('tags --> ');
        console.log(_tags);
        var _image_id = _removeImageInfoStatus._key;
        console.log('image Id --> ' + _image_id);
        for (var i = 0; i < _tags.length; i++) {
          var _tag_name = _tags[i];
          console.log('_tag_name --> ' + _tag_name);
          var _getImage = db._query(aql `FOR tag in ${tagsCollection} FILTER tag.tag_name == ${_tag_name} return tag`).toArray();

          if (_getImage[0]) {
            var index = _getImage[0].image_ids.indexOf(_image_id);
            console.log('index --> ' + index);
            if (index > -1) {
              _getImage[0].image_ids.splice(index, 1);
              var _updateStatus = db._query(aql`UPDATE {_key:${_getImage[0]._key},image_ids:${_getImage[0].image_ids}}`).toArray();
              if(isDebug) console.log('updateStatus --> fs');
              if(isDebug) console.log(_updateStatus);
            }
          }
          else console.log('error in get image!!!');
        }
      }
      let removeImageDataQuery = aql `REMOVE {_key:${_data_id}} in ${imagedataCollection}`;
      let _removeImageDataStatus = db._query(removeImageDataQuery).toArray();
      if (isDebug) console.log('/remove-image-by-data-id | _removeImageDataStatus --> ' + _removeImageDataStatus);
      res.send({
        status: true,
        description: "done remove data_id " + _data_id + " in server"
      })
    } else {
      res.send({
        status: false,
        description: "image data_id must not empty"
      })
    }
  })
  .body(joi.object({
    data_id: joi.string().required()
  }).required(), 'image data_id to remove')
  .response(joi.object({
    status: joi.boolean().required(),
    description: joi.string().required()
  }).required())
  .summary('remove image by data_id API')
  .description('use image_id in body to remove image-info in imageCollection and data in imagedata');

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

        //now insert to collection tags
        for (var i in _tags) {
          //   const query = aql `FOR img IN ${imageCollection} 
          //   SORT img.creationtime DESC
          //   LIMIT ${_startIndex}, 25 
          //   RETURN img`;
          // let _imageInfos = db._query(query).toArray();
          let _tagName = _tags[i].trim();
          console.log('tagName --> ' + _tagName);
          let checkExistTagQuery = aql `FOR tagName in ${tagsCollection}
                    FILTER tagName.tag_name == ${_tagName}
                    return tagName`
          let _checkExistStatus = db._query(checkExistTagQuery).toArray();
          console.log(_checkExistStatus);
          if (!JSON.stringify(_checkExistStatus).includes('tag_name')) {
            let insertTagQuery = aql `INSERT { tag_name:${_tagName},image_ids:[${_imageStatus._key}] } INTO ${tagsCollection}`;
            let _insertTagStatus = db._query(insertTagQuery).toArray();
            console.log(_insertTagStatus);
            if (_insertTagStatus) {
              if (isDebug) console.log('INSERT TO TAG COLLECTION | success image id --> ' + _imageStatus._key);
            }
          } else {
            let updateTagQuery = aql ` FOR tagName IN ${tagsCollection}
              FILTER tagName.tag_name == ${_tagName}
              UPDATE tagName WITH
              {
                  image_ids:PUSH(tagName.image_ids,${_imageStatus._key})
              }
              IN ${tagsCollection}`
            let _updateTagStatus = db._query(updateTagQuery);
            console.log(_updateTagStatus);
            if (_updateTagStatus) {
              if (isDebug) console.log('UPDATE TO TAG COLLECTION | success image id-->' + _imageStatus._key);
            }
          }
          // FOR tagName in test_tags
          // FILTER tagName.tag_name == "aaaaa"
          // UPDATE tagName with
          // {
          //     image_ids:PUSH(tagName.image_ids,"-333333")
          // }
          // in test_tags
        }

        // UPDATE doc WITH {
        //   hobbies: PUSH(doc.hobbies, "swimming")
        // } IN users

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
        description: "does not found image data id"
      })
    }
    // res.send(imgData);
  })
  .pathParam('ID', joi.string().required(), 'data_id of image to get.')
  .response(joi.object({
    "data_url": joi.string().required()
  }).required())
  .summary('Get image data from server')
  .description('Use data_id of image in paramPath to get image on server');

router.get('/get-image-info/:start', function (req, res) {
    let _startIndex = req.pathParams.start;
    console.log('startIndex --> ' + _startIndex);
    const query = aql `FOR img IN ${imageCollection} 
      SORT img.creationtime DESC
      LIMIT ${_startIndex}, 25 
      RETURN img`;
    let _imageInfos = db._query(query).toArray();
    console.log(_imageInfos);
    res.send(_imageInfos);
  })
  .pathParam('start', joi.number().required(), 'start index')
  .response(joi.array().items(joi.object().required()))
  .summary('Get about 25 image info')
  .description('Use this to get 25 image info and use that info to get more image!');

// FOR u IN users
// SORT u.firstName, u.lastName, u.id DESC
// LIMIT 2, 5
// RETURN u

router.get('/get-image-by-tagname/:tagName', function (req, res) {
    let _tagName = req.pathParams.tagName.trim();
    console.log('/get-image-by-tagname| _tagName  --> ' + _tagName);
    const query = aql `FOR tag in ${tagsCollection}
                      FILTER tag.tag_name == ${_tagName}
                      RETURN tag`;
    let _tagStatus = db._query(query).toArray();
    console.log('/get-image-by-tagname| _tagStatus --> ');
    console.log(_tagStatus);
    res.send(_tagStatus);
  })
  .pathParam('tagName', joi.string().required(), 'tag value')
  .response(joi.array().items(joi.object({
    tag_name: joi.string().required(),
    image_ids: joi.array().items(joi.string())
  })))
  .summary('Get image_ids by tag')
  .description('Use this to get image_ids by tagName which was sent by user');

router.get('/get-image-info-by-id/:ID', function (req, res) {
    let _ID = req.pathParams.ID;
    if (isDebug) console.log('/get-image-info-by-id/:ID| ID --> ' + _ID);
    var _imageDocument = imageCollection.document(_ID);
    if (_imageDocument) {
      if (isDebug) console.log('/get-image-info-by-id/:ID| found ID --> ' + _ID);
      res.send(_imageDocument);
    } else {
      res.send({
        status: false,
        description: "does not found image id"
      })
    }
  })
  .pathParam('ID', joi.string().required(), 'image_id to get.')
  .response(joi.object({
    title: joi.string().required(),
    data_id: joi.string().required(),
    tags: joi.array().items(joi.string()),
    creationtime: joi.number().required()
  }))
  .summary('Get image infomation from server')
  .description('Use image id in paramPath to get image infomation on server');