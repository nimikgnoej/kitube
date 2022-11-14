import { trusted } from "mongoose";
import User from "../models/User";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => res.render("join", { pageTitle: "회원가입" })
export const postJoin = async (req, res) => {
    const { name, username, email, password, password2, location } = req.body;
    if (password !== password2) {
        return res.status(400).render("join", { pageTitle: "회원가입", errorMessage: "비밀번호를 확인해주세요." });
    }
    const usernameExists = await User.exists({ $or: [{ username }, { email }] });
    if (usernameExists) {
        return res.status(400).render("join", { pageTitle: "회원가입", errorMessage: "이미 사용중인 이름/이메일 입니다." });
    }
    try {
        await User.create({
            name,
            username,
            email,
            password,
            location,
        });
        return res.redirect("/login");
    } catch (error) {
        return res.status(400).render("join", { pageTitle: "회원가입", errorMessage: error._message });
    }

};
export const getLogin = (req, res) => {
    res.render("login", { pageTitle: "로그인" });
}

export const postLogin = async (req, res) => {
    //계정이 있는지 확인하기

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).render("login", { pageTitle: "로그인", errorMessage: "해당 이름을 가진 사용자가 존재하지 않아요 😭" });
    }

    //비밀번호가 맞는지 확인하기
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        return res.status(400).render("login", { pageTitle: "로그인", errorMessage: "비밀번호가 틀렸습니다 ❌" });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
}

export const edit = (req, res) => res.send("Edit User");
export const remove = (req, res) => res.send("Remove User");
export const see = (req, res) => res.send("See User");
export const logout = (req, res) => res.send("Log Out");