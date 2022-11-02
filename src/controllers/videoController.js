export const trending = (req, res) => res.render("home", { pageTitle: "Home" });
export const see = (req, res) => res.render("watch", { pageTitle: "Watch" });
export const edit = (req, res) => res.render("edit");
export const search = (req, res) => res.send("Search Video");
export const upload = (req, res) => res.send("Uploads Video");
export const deleteVideo = (req, res) => res.send("Delete Video");
