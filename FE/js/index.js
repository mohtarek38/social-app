const baseURL = 'http://localhost:5000';

$("#login").click(() => {
    const email = $("#email").val();
    const password = $("#password").val();
    const data = {
        email,
        password
    }
    console.log({ data });
    axios({
        method: 'post',
        url: `${baseURL}/api/auth/signin`,
        data: data,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    }).then(function (response) {
        console.log({ response });
        const { data } = response.data
        if (data?.tokens?.accesstoken) {
            localStorage.setItem('token', data.tokens.accesstoken);
            window.location.href = 'chat.html';
        } else {
            console.log("In-valid email or password");
            alert("In-valid email or password")
        }
    }).catch(function (error) {
        console.log(error);
        alert(error.response?.data?.error?.message || "In-valid email or password");
    });

})






