document.addEventListener('DOMContentLoaded', function() {
    console.log("welcome");
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#send-submit').addEventListener('click', send_mail);
    // By default, load the inbox
    load_mailbox('inbox');
  });
  
  function get_todays_date_formatted(){
    months = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    today = new Date()
  
    day = today.getDate().toString()
    month = months[today.getMonth()].toString()
    year = today.getFullYear().toString()
  
    return month+' '+day+' '+year;
  }
  
  function email_was_read (id) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
  
      return ;
  }
  
  function add_to_archived(id){
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then((response) => {
        load_mailbox('inbox',"Email archived successfully!","success");
    });
  }
  
  function remove_from_archived(id){
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then((response) => {
        load_mailbox('inbox',"Email un-archived successfully!","success");
    });
  }
  
  function open_modal(this_email,mailbox) {
    let recipients_str = "";
  
    email = JSON.parse(this_email);
  
    if (email.recipients && email.recipients.length > 1) {
      for(let i = 0; i < email.recipients.length; i++){
        if(i == email.recipients.length - 1) 
          recipients_str += email.recipients[i];
        else  
          recipients_str += email.recipients[i]+', ';
      }
    }
    else{
      recipients_str += email.recipients;
    }

    let modal_time;
    if(get_todays_date_formatted() == email.timestamp.substr(0,11)){
        modal_time = "Today at: "+email.timestamp.slice(12);
    }
    else {
        modal_time = email.timestamp;
    }

    let email_arr = email.body.split('\n');
    let email_body = "";
    email_arr.forEach( line => {
        email_body = email_body+line+"<br>";
    })
    

  
    let archived_val = (email.archived == true) ? "Unarchive" :  "Archive";
    let function_arch = (email.archived == true) ? `remove_from_archived(${email.id})` : `add_to_archived(${email.id})`;
  
    newmodal = document.createElement('div');
    newmodal.innerHTML = `<div id="myModal" class="modal">
                              <!-- Modal content -->
                              <div class="modal-content">
                                <div class="modal-header">
                                  <span class="close grow">&times;</span>
                                </div>
                                <div class="modal-body">
                                  <div id="modal-top-line"><div id="modal-subj"><strong>${email.subject}</strong></div><div id="modal-time">${modal_time}</div></div><hr>
                                  <div>From: ${email.sender} </div>
                                  <div>To: ${recipients_str}</div>
                                  <div id="modal-body"><hr><p>`+email_body+`</p></div>
                                </div>
                                <div class="modal-footer">
                                  <button class="btn btn-primary" id="reply-btn"}>Reply</button>
                                  <button type="button" class="btn btn-outline-secondary" onclick=${function_arch}>${archived_val}</button>
                                </div>
                              </div>
                            </div>`;
    document.querySelector('#emails-view').appendChild(newmodal);
    document.querySelector('#myModal').style.display = "block";
    if(mailbox=='sent') {
        document.querySelector('#reply-btn').style.display = "none";
    }
    console.log("modal open");
    
    if(email.read == false) {
        email_was_read(email.id);
    }
  
    // Modal's functionality
    var modal = document.querySelector("#myModal");
    var span = document.getElementsByClassName("close")[0];
    var reply = document.querySelector('#reply-btn');
    span.onclick = function() {
      modal.style.display = "none";
    }
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
    reply.onclick = () => {
        reply_to_email(email);
    }


  }

  function reply_to_email(email) {
    
    let recip = email.sender;

    let subj="";
    if(email.subject.startsWith("Re:")){
        subj = email.subject;
    }
    else {
        subj = "Re: "+email.subject;
    }

    let newbod = email.body.split("\n"); 
    let body_string = "";
    const leng = newbod.length
    for(let j = 0; j < leng; j++) {
        newbod[j] = ">> " + newbod[j];
        body_string += newbod[j]+"\n";
    }
    

    let bod=`On ${email.timestamp} ${email.sender} said: \n ${body_string}`;

    compose_email("",recip,subj,bod);
  }
  

  function compose_email(a,recip,sub,bod) {
      a="";
      recip = recip || "";
      sub = sub || "";
      bod = bod || "";

    // Make compose btn active
    var elems = document.querySelectorAll(".btn");

    [].forEach.call(elems, function(el) {
        el.classList.remove("active");
    });

    document.querySelector(`#compose`).classList.add('active');
  
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    if (document.querySelector('.alert')){document.querySelector('.alert').style.display = 'none';}
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = recip;
    document.querySelector('#compose-subject').value = sub;
    document.querySelector('#compose-body').value = bod;

  }
  
  function load_mailbox(mailbox,message,kind) {
    var elems = document.querySelectorAll(".btn");

    [].forEach.call(elems, function(el) {
        el.classList.remove("active");
    });
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector(`#${mailbox}`).classList.add('active');
  
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><hr>`;
    get_category(mailbox,message,kind);
  }
  
  function send_mail(event) {

    let recps = document.querySelector('#compose-recipients').value.replace(' ','');

    fetch('/emails',
    {
      method:'POST',
      body: JSON.stringify({
        recipients: recps,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      }) 
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      if (result.error) {
        document.querySelector('#compose-view').innerHTML = `<div class="alert alert-danger" role="alert">${result.error}</div>`+document.querySelector('#compose-view').innerHTML;
      }
      else{
        setTimeout(load_mailbox('sent',result.message,"success"),2000);
      }
    })
    .catch((err) => {
      document.querySelector('#compose-view').innerHTML = `<div class="alert alert-danger" role="alert">${err.error}</div>`+document.querySelector('#compose-view').innerHTML;
    });
    event.preventDefault();
  }
  
  function display_data(data, mailbox) {
  
    let father = document.createElement('div');
    father.id = 'father';
  
    let i = 0;

    if(data.length == 0) {
        document.querySelector("#emails-view").innerHTML += `<div class="alert alert-info" role="alert">Oops...No emails found here yet!</div>` ;
    }
  
    data.forEach(this_email => {
      let bigdiv = document.createElement('div');
      let newemail = document.createElement('div');
      newemail.classList.add('details');
  
      let mail = JSON.stringify(this_email);
      newemail.onclick = function(){
        open_modal(mail,mailbox);
      }
  
      let sender = document.createElement('div');
      let subject = document.createElement('div');
      let emailbody = document.createElement('div');
      let timestamp = document.createElement('div');
  
      bigdiv.id = `email-line-${this_email.id}`;
      bigdiv.classList.add('email-line');
      bigdiv.classList.add('grow');
  
      if(mailbox=="sent") {
        bigdiv.classList.add('read-line');
        sender.classList.add('read');
        subject.classList.add('read');
        timestamp.classList.add('read');
      }
      else{
        if(this_email.read === false) {
          bigdiv.classList.add('unread-line');
          sender.classList.add('unread');
          subject.classList.add('unread');
          timestamp.classList.add('unread')
        }
        else {
          bigdiv.classList.add('read-line');
          sender.classList.add('read');
          subject.classList.add('read');
          timestamp.classList.add('read');
        }
      }
  
      sender.classList.add('sender-st');
      subject.classList.add('subject-st');
      emailbody.classList.add('body-st');
      timestamp.classList.add('timestamp-st');
  
      sender.innerHTML = this_email.sender;
      subject.innerHTML = this_email.subject;
  
      if(this_email.body.length > 20){
        emailbody.innerHTML = this_email.body.substr(0,20)+"...";
      }
      else {
        emailbody.innerHTML = this_email.body;
      }
  
      if(get_todays_date_formatted() == this_email.timestamp.substr(0,11)){
        timestamp.innerHTML = this_email.timestamp.slice(12);
      }
      else {
        timestamp.innerHTML = this_email.timestamp.substr(0,6);
      }
  
      newemail.appendChild(sender);
      newemail.appendChild(subject);
      newemail.appendChild(emailbody);
      newemail.appendChild(timestamp);
  
      bigdiv.appendChild(newemail);
  
      //archive-button-functionality
      let archive_button = document.createElement('div');
      if(mailbox=='inbox')
      {
        archive_button.innerHTML = `<div onclick="add_to_archived(\`${this_email.id}\`)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive" viewBox="0 0 16 16"><path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"></path></svg></div>`
        archive_button.classList.add("archive");
        bigdiv.appendChild(archive_button);
      }
      if(mailbox=='archive')
      {
        archive_button.innerHTML = `<div onclick="remove_from_archived(\`${this_email.id}\`)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive-fill" viewBox="0 0 16 16"><path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15h9.286zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zM.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8H.8z"/></svg></div>`
        archive_button.classList.add("unarchive");
        bigdiv.appendChild(archive_button);
      }
  
      father.appendChild(bigdiv);
      document.querySelector('#emails-view').appendChild(father);
      i++;
    })
  
    return ;
  
  }
  
  function get_category(mailbox,message,kind){
    if(kind==="success")
      document.querySelector("#emails-view").innerHTML += `<div class="alert alert-success" role="alert">${message}</div>` ;
    if(kind==="error")
      document.querySelector("#emails-view").innerHTML += `<div class="alert alert-danger" role="alert">${message}</div>` ;
  
    fetch(`emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {
      console.log(result)
      setTimeout(display_data(result,mailbox),500);
    })
    .catch((err) => {
      console.log(err);
    });
  }