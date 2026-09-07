let handler;
module.exports = async (req, res) => {
  if (!handler) {
    const [{createCloudHandler}, {createBlobRepository}] = await Promise.all([import('../server/billing-cloud.mjs'), import('../server/billing-blob.mjs')]);
    handler = createCloudHandler({repository:createBlobRepository()});
  }
  return handler(req,res);
};
