import Video from "../models/Video";

export const home = async (req, res) => {
  const videos = await Video.find({});
  return res.render("home", { pageTitle: "기튜브", videos });
};
export const watch = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id);
  if (video)
    return res.render("watch", { pageTitle: video.title, video });
  else
    return res.render("404", { pageTitle: "Video Not found" });
}
export const getEdit = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id);
  if (!video) {
    return res.render("404", { pageTitle: "Video Not found" });
  }
  return res.render("edit", { pageTitle: `이곳에서 영상을 수정하세요!`, video });
};

export const postEdit = async (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const description = req.body.description;
  const hashtags = req.body.hashtags;
  const video = await Video.exists({ _id: id });

  if (!video) {
    return res.render("404", { pageTitle: "Video Not Found" });
  }

  try {
    await Video.findByIdAndUpdate(id, {
      title,
      description,
      hashtags: Video.formathashtags(hashtags),
    });
    return res.redirect(`/videos/${id}`);
  } catch {
    return res.render("edit", { pageTitle: `이곳에서 영상을 수정하세요!`, video });
  }
}

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "영상 업로드" });
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
      hashtags: Video.formathashtags(hashtags),
    });
    return res.redirect("/");
  } catch (error) {
    return res.render("upload", { pageTitle: "영상 업로드", errorMessage: error._message, });
  }
}

export const deleteVideo = async (req, res) => {
  const id = req.params.id;
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
}

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    });
  };
  return res.render("search", { pageTitle: "영상 검색", videos });
}