import _ from "lodash";
import moment from "moment";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
const removeMd = require("remove-markdown");
moment().format();

const searchIssuesForm = document.querySelector("#search_issues_form");
const resultsContainer = document.querySelector("#results_container");

searchIssuesForm.addEventListener("submit", searchFormSubmitted);

function searchFormSubmitted(e) {
  e.preventDefault();
  e.submitter.setAttribute("disabled", "");
  const username = e.target.elements["username"].value;
  const repository = e.target.elements["repository"].value;

  fetchIssuesListFromGithub(username, repository)
    .then(() => {
      enableSubmittButton(e);
    })
    .catch((err) => {
      resultsContainer.innerHTML = `<span class="badge badge-danger">Something went wrong: ${err.message}</span>`;
      enableSubmittButton(e);
    });

  return;
}

function enableSubmittButton(e) {
  e.submitter.removeAttribute("disabled");
  return;
}

async function fetchIssuesListFromGithub(username, repository) {
  let issues_list = [];

  const responce = await fetch(
    `https://api.github.com/repos/${username}/${repository}/issues`
  );

  if (responce.status != "200") {
    throw new Error(responce.statusText);
  }
  const result = responce.json();

  await result
    .then((data) => {
      issues_list = data.map(
        ({
          number,
          title,
          html_url,
          body,
          created_at,
          state,
          updated_at,
          user,
          closed_at,
          comments,
          comments_url,
        }) => ({
          issue_number: number,
          created_at,
          updated_at,
          closed_at,
          title,
          html_url,
          description: body,
          state,
          author: user.login,
          comments,
          comments_url,
        })
      );
      return issues_list;
    })
    .then((data) => {
      printIssues(data);
    });
}

function printIssues(params) {
  resultsContainer.innerHTML = '<ul class="timeline"></ul>';
  params.forEach((element) => {
    let issue_block = printIssue(element);
    resultsContainer.firstElementChild.append(issue_block);
  });

  return;
}

function printIssue(element) {
  let issue_block;
  let descr = removeMd(element.description);
  let descrMaxLength = 300;

  issue_block = document.createElement("li");
  if (element.closed_at !== null) {
    issue_block.className = "closed";
  }
  issue_block.innerHTML += `
  <a target="_blank" href="${element.html_url}">${element.title}</a>
  <span class="float-right">${moment(element.created_at,"YYYYMMDD").fromNow()}</span>
  <p>${shorten(descr, descrMaxLength)} ... </p>`;

  return issue_block;
}

function shorten(text, max) {
  return text && text.length > max
    ? text.slice(0, max).split(" ").slice(0, -1).join(" ")
    : text;
}
