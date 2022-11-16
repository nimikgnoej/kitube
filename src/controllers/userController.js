import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";
import { response } from "express";

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
//?client_id = ${ REST_API_KEY }& redirect_uri=${ REDIRECT_URI }& response_type=code

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

export const edit = (req, res) => res.send("Edit User");
export const see = (req, res) => res.send("See User");
export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/");
};