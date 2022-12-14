import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  const videos = await Video.find({}).sort({ createdAt: "desc" }).populate("owner");
  return res.render("home", { pageTitle: "기튜브", videos });
};
export const watch = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (video)
    return res.render("watch", { pageTitle: video.title, video });
  else
    return res.render("404", { pageTitle: "Video Not found" });
}
export const getEdit = async (req, res) => {
  const id = req.params.id;
  const { user: { _id } } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.render("404", { pageTitle: "Video Not found" });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/")
  }
  return res.render("edit", { pageTitle: `이곳에서 영상을 수정하세요!`, video });
};

export const postEdit = async (req, res) => {
  const { user: { _id } } = req.session;
  const id = req.params.id;
  const title = req.body.title;
  const description = req.body.description;
  const hashtags = req.body.hashtags;
  const video = await Video.exists({ _id: id });

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video Not Found" });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/")
  }

  try {
    await Video.findByIdAndUpdate(id, {
      title,
      description,
      hashtags: Video.formathashtags(hashtags),
    });
    req.flash("success", "변경사항이 저장되었습니다.")
    return res.redirect(`/videos/${id}`);
  } catch {
    return res.render("edit", { pageTitle: `이곳에서 영상을 수정하세요!`, video });
  }
}

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "영상 업로드" });
}

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  const title = req.body.uploadTitle;
  const description = req.body.description;
  const hashtags = req.body.hashtags;

  try {
    const newVideo = await Video.create({
      title: title,
      description: description,
      fileUrl: video[0].path,
      thumbUrl: thumb[0].path.replace(/[\\]/g, "/"),
      owner: _id,
      hashtags: Video.formathashtags(hashtags),
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", { pageTitle: "영상 업로드", errorMessage: error._message, });
  }
}

export const deleteVideo = async (req, res) => {
  const id = req.params.id;
  const { user: { _id } } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "권한이 없습니다.");
    return res.status(403).redirect("/")
  }
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
    }).populate("owner");
  };
  return res.render("search", { pageTitle: "영상 검색", videos });
}

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views += 1;
  await video.save();
  return res.sendStatus(200);
}

export const createComment = async (req, res) => {
  const {
    session: { user },
    body: { text },
    params: { id },
  } = req;

  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text: text,
    owner: user._id,
    video: id,
  });
  video.comments.push(comment._id);
  video.save();
  return res.status(201).json({ newCommentId: comment._id });
}

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const {
    session: {
      user: {
        _id
      },
    },
  } = req;

  const targetComment = await Comment.findById(id).populate("owner");
  const videoId = targetComment.video;
  const video = await Video.findById(videoId);
  if (!video) {
    return res.sendStatus(404);
  }

  if (String(targetComment.owner._id) !== String(_id)) {
    return res.sendStatus(404);
  }
  await video.save();
  await Comment.findByIdAndDelete(id);
  return res.sendStatus(200);
}