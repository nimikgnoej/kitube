import Video from "../models/Video";

export const home = async (req, res) => {
  const videos = await Video.find({});
  return res.render("home", { pageTitle: "Home", videos });
};
export const watch = (req, res) => {
  const id = req.params.id;
  return res.render("watch", { pageTitle: `Watching` });
}
export const getEdit = (req, res) => {
  const id = req.params.id;
  return res.render("edit", { pageTitle: `Editing` });
};

export const postEdit = (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  return res.redirect(`/videos/${id}`);
}

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload" });
}

export const postUpload = async (req, res) => {
  //이곳에서 비디오 배열에 추가함
  const title = req.body.uploadTitle;
  const description = req.body.description;
  const hashtags = req.body.hashtags;

  try {
    await Video.create({
      title: title,
      description: description,
      hashtags: hashtags.split(",").map((word) => `#${word}`),
    });
    return res.redirect("/");
  } catch (error) {
    return res.render("upload", { pageTitle: "Upload", errorMessage: error._message, });
  }
}