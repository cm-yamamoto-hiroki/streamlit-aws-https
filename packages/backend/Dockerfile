# Use an official Python runtime as the parent image
FROM python:3.11-slim

WORKDIR /app

# # install requirements
COPY ./tmp/requirements_base.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ./tmp/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

# copy files
COPY main.py ./main.py
# COPY lib ./lib

# display log out of container (seen from cloudwatch logs)
ENV PYTHONUNBUFFERED 1

# Output current directory
CMD ["streamlit", "run", "main.py"]
