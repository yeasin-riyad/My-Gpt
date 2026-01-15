// SDK initialization
import ImageKit from "imagekit";

var imagekit = new ImageKit({
    publicKey : process.env.ImageKit_Public_key,
    privateKey : process.env.ImageKit_Private_key,
    urlEndpoint :process.env.ImageKit_URL_endpoint
});

export default imagekit;