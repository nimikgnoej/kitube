import User from "../models/User";
import Video from "../models/Video";
import fetch from "node-fetch";
import bcrypt from "bcrypt";
import { response } from "express";
import { render } from "pug";

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
    const user = await User.findOne({ username, socialOnly: false });
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

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GH_CLIENT,
        allow_signup: false,
        scope: "read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
}

export const finishGithubLogin = async (req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;

    const tokenRequest = await (
        await fetch(finalUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
        })
    ).json();

    if ("access_token" in tokenRequest) {
        const { access_token } = tokenRequest;
        const apiUrl = "https://api.github.com"
        const userData = await (
            await fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();

        const emailData = await (
            await fetch(`${apiUrl}/user/emails`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if (!emailObj) {
            return res.redirect("/login");
        }
        let user = await User.findOne({ email: emailObj.email });
        if (!user) {
            user = await User.create({
                avatarUrl: userData.avatar_url,
                name: userData.name,
                username: userData.login,
                email: emailObj.email,
                password: "",
                socialOnly: true,
                location: userData.location,
            });
        }
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    } else {
        return res.redirect("/login");
    }
}

export const startKakaoLogin = (req, res) => {
    const baseUrl = "https://kauth.kakao.com/oauth/authorize";
    const config = {
        client_id: "7e713af9072da77a896bfedf3c8685bb",
        redirect_uri: "http://localhost:4000/users/kakao/finish",
        response_type: "code",
        scope: "account_email,gender,profile_nickname",
    }
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
}

export const finishKakaoLogin = async (req, res) => {
    const baseUrl = "https://kauth.kakao.com/oauth/token";
    const config = {
        grant_type: "authorization_code",
        client_id: "7e713af9072da77a896bfedf3c8685bb",
        redirect_uri: "http://localhost:4000/users/kakao/finish",
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
        await fetch(finalUrl, {
            method: "POST",
            "Content-Type": "application/x-www-form-urlencoded",
        })
    ).json();

    if ("access_token" in tokenRequest) {
        const { access_token } = tokenRequest;
        const apiUrl = "https://kapi.kakao.com";
        const kakaoData = await (await (fetch(`${apiUrl}/v2/user/me`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }))).json();

        let user = await User.findOne({ email: kakaoData.kakao_account.email });
        if (!user) {
            user = await User.create({
                name: kakaoData.kakao_account.profile.nickname,
                username: kakaoData.kakao_account.profile.nickname,
                email: kakaoData.kakao_account.email,
                password: "",
                socialOnly: true,
            });
        }
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    }
}

export const getEdit = (req, res) => {
    return res.render("edit-profile", { pageTitle: "프로필 수정" });
}

export const postEdit = async (req, res) => {
    const {
        name,
        email,
        username,   //=> 새로 바꾼애들
        location,
    } = req.body;
    const id = req.session.user._id;
    const { avatarUrl } = req.session.user;
    const { file } = req;

    //email이 중복될때
    if (email !== req.session.user.email) {
        const dupEmail = await User.exists({ email });
        if (dupEmail) {
            return res.render("edit-profile", { pageTitle: "프로필 수정", errorMessage: "이메일이 다른 사용자와 중복돼요 :(" });
        }
    }
    //이름이 중복될때
    if (name !== req.session.user.name) { //이름을 바꾸려고 할때 
        const dupName = await User.exists({ name });
        if (dupName) { //중복되는 이름이 있다면..
            return res.render("edit-profile", { pageTitle: "프로필 수정", errorMessage: "이름이 중복돼요 :(" });
        }
    }
    //사용자 이름이 중복될때
    if (username !== req.session.user.username) {
        const dupUserName = await User.exists({ username });
        if (dupUserName) {
            return res.render("edit-profile", { pageTitle: "프로필 수정", errorMessage: "사용자 이름이 중복돼요 :(" });
        }
    }


    const updatedUser = await User.findByIdAndUpdate(id, {
        avatarUrl: file ? file.path : avatarUrl,
        name: name,
        email: email,
        username: username,
        location: location,
    }, { new: true });
    req.session.user = updatedUser;

    return res.redirect("/users/edit");
}

export const getChangePassword = (req, res) => {
    if (req.session.user.socialOnly === true) {
        req.flash("error", "비밀번호를 바꿀 수 없어요 :(");
        return res.redirect("/");
    }
    return res.render("users/change-password", { pageTitle: "비밀번호 변경" });
}

export const postChangePassword = async (req, res) => {
    const {
        session: {
            user: { _id, password },
        },
        body: { oldPassword, newPassword, newPasswordConfirmation },
    } = req;
    const ok = await bcrypt.compare(oldPassword, password);
    if (!ok) {
        return res.status(400).render("users/change-password", { pageTitle: "비밀번호 변경", errorMessage: "현재 비밀번호가 일치하지 않아요 :(" });
    }
    if (newPassword !== newPasswordConfirmation) {
        return res.status(400).render("users/change-password", { pageTitle: "비밀번호 변경", errorMessage: "비밀번호를 다시 확인해주세요!" });
    }
    const user = await User.findById(_id);
    user.password = newPassword;
    await user.save();
    req.session.user.password = user.password;
    req.flash("info", "비밀번호가 변경되었어요 :D");
    return res.redirect("/users/logout");
}

export const logout = (req, res) => {
    req.session.destroy();
    req.flash("info", "Good Bye");
    return res.redirect("/");
};
export const see = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("videos");
    if (!user) {
        return res.status(404).render("404", { pageTitle: "유저가 존재하지 않음." });
    }
    return res.render("users/profile", { pageTitle: user.name, user });
}