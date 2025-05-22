import os
from constructs import Construct
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    BundlingOptions,
    Size,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_sns as sns,
    aws_sns_subscriptions as subs,
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
            memory_size=1024,  # Increase from default 128MB to 1024MB for better performance
            ephemeral_storage_size=Size.mebibytes(1024),  # Increase from default 512MB
            environment={
                # Always fall back to empty strings to avoid JSII "None" serialization issues
                "MYSQL_HOST": os.getenv("MYSQL_HOST", ""),
                "MYSQL_PORT": os.getenv("MYSQL_PORT", ""),
                "MYSQL_USER": os.getenv("MYSQL_USER", ""),
                "MYSQL_PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
                "MYSQL_DATABASE": os.getenv("MYSQL_DATABASE", ""),
                "MYSQL_SSL_CA": os.getenv("MYSQL_SSL_CA", ""),
                "S3_BUCKET": bucket.bucket_name,
                # Performance optimization - disable schema init on Lambda
                "INIT_SCHEMA": "false",
                # MailerSend API configuration
                "MAIL_API": os.getenv("mail_api", ""),
                "mail_username": os.getenv("mail_username", ""),
                "mail_from_name": os.getenv("mail_from_name", ""),
            },
            timeout=Duration.seconds(60),
        )
        # Grant explicit S3 permissions with all required actions
        bucket.grant_read_write(fn)
        # Add explicit S3 permissions to ensure all required actions are included
        fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                    "s3:GetBucketLocation"
                ],
                resources=[
                    bucket.bucket_arn,
                    f"{bucket.bucket_arn}/*"
                ]
            )
        )

        # Create SNS topic for notifications
        topic = sns.Topic(self, "NotificationTopic")
        # Allow the API Lambda to publish to the topic
        topic.grant_publish(fn)
        # Expose the topic ARN to the API Lambda via environment variable
        fn.add_environment("NOTIFICATION_TOPIC_ARN", topic.topic_arn)

        # Lambda function to process SNS notifications asynchronously
        notification_fn = lambda_.Function(
            self,
            "NotificationProcessor",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="main.process_notification",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "..", ".."),
                exclude=[
                    # Exclude CDK source and its output directory
                    "cdk",
                    "cdk/*",
                    "cdk/**",
                    "cdk.out",
                    "cdk.out/**",
                    "**/.venv/**",
                    "**/__pycache__/**",
                    "tests",
                    "tests/**",
                ],
                bundling=BundlingOptions(
                    image=lambda_.Runtime.PYTHON_3_11.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install --no-cache-dir -r requirements.txt -t /asset-output && rsync -av --exclude 'cdk/**' --exclude '.venv/**' --exclude '__pycache__/**' ./ /asset-output",
                    ],
                ),
            ),
            architecture=lambda_.Architecture.ARM_64,
            memory_size=1024,  # Increase from default 128MB to 1024MB for better performance
            ephemeral_storage_size=Size.mebibytes(1024),  # Increase from default 512MB
            environment={
                "MYSQL_HOST": os.getenv("MYSQL_HOST", ""),
                "MYSQL_PORT": os.getenv("MYSQL_PORT", ""),
                "MYSQL_USER": os.getenv("MYSQL_USER", ""),
                "MYSQL_PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
                "MYSQL_DATABASE": os.getenv("MYSQL_DATABASE", ""),
                "MYSQL_SSL_CA": os.getenv("MYSQL_SSL_CA", ""),
                # Performance optimization - disable schema init on Lambda
                "INIT_SCHEMA": "false",
                # MailerSend API configuration
                "MAIL_API": os.getenv("mail_api", ""),
                "mail_username": os.getenv("mail_username", ""),
                "mail_from_name": os.getenv("mail_from_name", ""),
            },
            timeout=Duration.seconds(60),
        )
        # Subscribe the notification processor to the SNS topic
        topic.add_subscription(subs.LambdaSubscription(notification_fn))

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