#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.mailbox_api_stack import MailboxApiStack

app = cdk.App()
MailboxApiStack(app, "MailboxApiStack")
app.synth()