let videos = [
  {
    title: "First video",
    rating: 5,
    comments: 40,
    createdAt: "2 min ago",
    views: 2000321,
    id: 1,
  },
  {
    title: "Second video",
    rating: 4.5,
    comments: 412,
    createdAt: "3 min ago",
    views: 343200321,
    id: 2,
  },
  {
    title: "Third video",
    rating: 4.6,
    comments: 23,
    createdAt: "40 min ago",
    views: 15342158,
    id: 3,
  },
  {
    title: "Fourth video",
    rating: 5,
    comments: 4331,
    createdAt: "10 min ago",
    views: 534847,
    id: 4,
  },
];

export const trending = (req, res) => {
  return res.render("home", { pageTitle: "Home", videos });
};
export const watch = (req, res) => {
  const id = req.params.id;
  const video = videos[id - 1];
  return res.render("watch", { pageTitle: `Watching ${video.title}`, video });
}
export const getEdit = (req, res) => {
  const id = req.params.id;
  const video = videos[id - 1];
  return res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};

export const postEdit = (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  videos[id - 1].title = title;
  return res.redirect(`/videos/${id}`);
}

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload" });
}

export const postUpload = (req, res) => {
  //이곳에서 비디오 배열에 추가함
  const newVideo = {
    title: req.body.uploadTitle,
    rating: 0,
    comments: 0,
    createdAt: "1 min ago",
    views: 0,
    id: videos.length + 1,
  };
  videos.push(newVideo);
  return res.redirect("/");
}