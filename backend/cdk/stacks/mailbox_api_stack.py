import os
from constructs import Construct
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    BundlingOptions,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
)

class MailboxApiStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # S3 bucket – block all public access and move objects to
        # INTELLIGENT_TIERING automatically so storage costs scale down over time.
        bucket = s3.Bucket(
            self,
            "ImagesBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(0),
                        )
                    ],
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                )
            ],
            removal_policy=RemovalPolicy.RETAIN,  # keep data if stack is deleted
        )

        fn = lambda_.Function(
            self,
            "MailboxApiHandler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="main.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "..", ".."),
                exclude=[
                    # Exclude CDK source and its output directory to prevent recursive asset packaging
                    "cdk",
                    "cdk/*",
                    "cdk/**",
                    "cdk.out",
                    "cdk.out/**",
                    "**/.venv/**",
                    "**/__pycache__/**",
                    # Exclude tests
                    "tests",
                    "tests/**",
                ],
                bundling=BundlingOptions(
                    image=lambda_.Runtime.PYTHON_3_11.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        # Install runtime requirements and copy project excluding CDK dir to avoid recursive copy
                        "pip install --no-cache-dir -r requirements.txt -t /asset-output && rsync -av --exclude 'cdk/**' --exclude '.venv/**' --exclude '__pycache__/**' ./ /asset-output",
                    ],
                ),
            ),
            architecture=lambda_.Architecture.ARM_64,
            environment={
                # Always fall back to empty strings to avoid JSII "None" serialization issues
                "MYSQL_HOST": os.getenv("MYSQL_HOST", ""),
                "MYSQL_PORT": os.getenv("MYSQL_PORT", ""),
                "MYSQL_USER": os.getenv("MYSQL_USER", ""),
                "MYSQL_PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
                "MYSQL_DATABASE": os.getenv("MYSQL_DATABASE", ""),
                "MYSQL_SSL_CA": os.getenv("MYSQL_SSL_CA", ""),
                "S3_BUCKET": bucket.bucket_name,
                "SES_SOURCE_EMAIL": os.getenv("SES_SOURCE_EMAIL", ""),
            },
            timeout=Duration.seconds(60),
        )

        bucket.grant_read_write(fn)

        fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["ses:SendEmail", "sns:Publish"],
                resources=["*"],
            )
        )

        # Reduce CloudWatch Logs retention to cut log storage costs
        logs.LogRetention(
            self,
            "FnLogRetention",
            log_group_name=fn.log_group.log_group_name,
            retention=logs.RetentionDays.TWO_WEEKS,
        )

        # Use a Lambda Function URL instead of API Gateway REST API – removes API GW cost
        fn_url = fn.add_function_url(
            auth_type=lambda_.FunctionUrlAuthType.NONE,
        )

        CfnOutput(self, "MailboxFunctionUrl", value=fn_url.url) 