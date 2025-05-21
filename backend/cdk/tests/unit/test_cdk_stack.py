import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Template
from stacks.mailbox_api_stack import MailboxApiStack

@pytest.fixture
def template():
    app = cdk.App()
    stack = MailboxApiStack(app, "TestStack")
    return Template.from_stack(stack)

def test_s3_bucket_created(template):
    template.has_resource_properties("AWS::S3::Bucket", {})