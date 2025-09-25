const setTokeninCookie = async function (res, token) {

    // here we have to do,i mean set token inside cookie
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: process.env.JWT_COOKIE_EXPIRES_MS
    }
    res.cookie('token', token, cookieOptions);

    // we do this sending part in our controller not here
    // res.json({ success: true, token })

}
export { setTokeninCookie };