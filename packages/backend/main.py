import re

import jwt
import streamlit as st
from streamlit.web.server.websocket_headers import _get_websocket_headers


def submit(text: str):
    st.write(f"Hello {text}!")


st.title("Hello World")


# headers = _get_websocket_headers()
# # st.write(headers)
# if not headers:
#     st.error("認証情報が取得できません")
# else:
#     # st.write(access_token)
#     # st.write(oidc_data_jwt)
#     cookie_str = headers.get("Cookie")
#     if not cookie_str:
#         st.error("認証情報が取得できません")

#     else:
#         # st.write(cookie_str)
#         rets = re.findall(r"idToken=(.+?);", cookie_str)
#         # st.write(rets)
#         if len(rets) == 0:
#             st.error("認証情報が取得できません")
#         elif len(rets) > 1:
#             st.error("認証情報が複数取得されました")
#         else:
#             id_token = rets[0]
#             # st.write(id_token)

#             decode = jwt.decode(
#                 id_token, options={"verify_signature": False}
#             )  # cloudfrontで認証されているため、ここで署名の検証は不要
#             st.write("email", decode["email"])
#             st.write("cognito_username", decode["cognito:username"])


# st.markdown("---")

text = st.text_input("Enter your name", "John Doe")

button_submit = st.button("Submit")


if button_submit:
    submit(text)
