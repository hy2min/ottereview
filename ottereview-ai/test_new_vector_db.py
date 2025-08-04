import sys
import os
sys.path.append('.')
from utils.vector_db import VectorDB, PRData, FileInfo, CommitInfo, ReviewInfo, ReviewCommentInfo
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_new_vector_db():
    print('Testing new vector DB with updated data models')
    
    try:
        # VectorDB instance creation
        vector_db = VectorDB('./test_new_chroma')
        print('SUCCESS: VectorDB instance created')
        print(f'Collections: pr_collection, review_collection, reviewer_collection')
        
        # Create comprehensive test PR data
        
        # File changes
        files = [
            FileInfo(
                filename='src/components/UserProfile.tsx',
                status='added',
                additions=85,
                deletions=0,
                patch='@@ -0,0 +1,85 @@\n+import React from "react";\n+export const UserProfile = () => {\n+  return <div>Profile</div>\n+}'
            ),
            FileInfo(
                filename='src/styles/UserProfile.css',
                status='added',
                additions=45,
                deletions=0,
                patch='@@ -0,0 +1,45 @@\n+.profile-container {\n+  padding: 20px;\n+}'
            ),
            FileInfo(
                filename='src/types/User.ts',
                status='modified',
                additions=15,
                deletions=5,
                patch='@@ -10,5 +10,15 @@\n+export interface UserProfile {\n+  id: string;\n+  name: string;\n+}'
            ),
            FileInfo(
                filename='tests/UserProfile.test.tsx',
                status='added',
                additions=30,
                deletions=0,
                patch='@@ -0,0 +1,30 @@\n+import { render } from "@testing-library/react";\n+import UserProfile from "../src/components/UserProfile";'
            )
        ]
        
        # Commits
        commits = [
            CommitInfo(
                sha='abc123',
                message='feat: add user profile component',
                author_name='frontend-dev',
                author_email='frontend-dev@company.com',
                additions=130,
                deletions=5
            ),
            CommitInfo(
                sha='def456',
                message='test: add user profile tests',
                author_name='frontend-dev',
                author_email='frontend-dev@company.com',
                additions=45,
                deletions=0
            )
        ]
        
        # Review comments
        review_comments = [
            ReviewCommentInfo(
                user_name='senior-dev',
                path='src/components/UserProfile.tsx',
                body='좋은 구현입니다. PropTypes를 추가하는 것을 고려해보세요.',
                position=15
            ),
            ReviewCommentInfo(
                user_name='senior-dev',
                path='src/styles/UserProfile.css',
                body='CSS 변수를 사용하면 더 유지보수하기 좋을 것 같습니다.',
                position=5
            )
        ]
        
        # Reviews
        reviews = [
            ReviewInfo(
                user_github_username='senior-dev',
                state='APPROVED',
                body='전반적으로 잘 구현되었습니다. 몇 가지 개선 제안사항이 있습니다.',
                commit_sha='abc123',
                review_comments=review_comments
            ),
            ReviewInfo(
                user_github_username='ui-expert',
                state='REQUEST_CHANGES',
                body='UI 접근성 개선이 필요합니다.',
                commit_sha='abc123',
                review_comments=[
                    ReviewCommentInfo(
                        user_name='ui-expert',
                        path='src/components/UserProfile.tsx',
                        body='aria-label을 추가해주세요.',
                        position=20
                    )
                ]
            )
        ]
        
        # Complete PR data
        pr_data = PRData(
            source_branch='feature/user-profile',
            target_branch='develop',
            title='feat: 사용자 프로필 컴포넌트 구현',
            body='사용자 프로필을 표시하는 새로운 React 컴포넌트를 추가했습니다. 반응형 디자인과 테스트 코드가 포함되어 있습니다.',
            repository_name='ottereview-frontend',
            files=files,
            commits=commits,
            reviewers=['senior-dev', 'ui-expert', 'backend-reviewer'],
            reviews=reviews
        )
        
        print('SUCCESS: Test PR data created')
        print(f'  - Files: {len(pr_data.files)} files')
        print(f'  - Commits: {len(pr_data.commits)} commits')
        print(f'  - Reviews: {len(pr_data.reviews)} reviews')
        print(f'  - Reviewers: {len(pr_data.reviewers)} reviewers')
        
        # Test PR data storage
        pr_id = 'test-pr-comprehensive-001'
        print(f'\\nStoring PR data: {pr_id}')
        
        store_result = await vector_db.store_pr_data(pr_id, pr_data)
        
        if store_result:
            print('SUCCESS: PR data stored successfully')
            
            # Check collection counts
            pr_count = vector_db.pr_collection.count()
            review_count = vector_db.review_collection.count()
            reviewer_count = vector_db.reviewer_collection.count()
            
            print(f'Collection counts:')
            print(f'  - PR collection: {pr_count}')
            print(f'  - Review collection: {review_count}')
            print(f'  - Reviewer collection: {reviewer_count}')
            
        else:
            print('ERROR: Failed to store PR data')
            return
        
        print('\\nNew vector DB test completed successfully')
        
    except Exception as e:
        print(f'Test error: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_new_vector_db())