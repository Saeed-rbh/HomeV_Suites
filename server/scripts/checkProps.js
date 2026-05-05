const p = require('../db');
p.property.findMany({ select: { id: true, externalId: true, title: true, images: true, thumbnailUrl: true }})
  .then(r => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); });
