from app import get_db
from datetime import datetime, timedelta

def get_collection(collection_name):
    db = get_db()
    return db.get_collection(collection_name)

def get_unread_notifications(limit=50):
    """Get unread notifications"""
    notifications_collection = get_collection('notifications')
    return list(notifications_collection.find({
        'read': False
    }).sort('timestamp', -1).limit(limit))

def get_all_notifications(limit=100):
    """Get all notifications (read and unread)"""
    notifications_collection = get_collection('notifications')
    return list(notifications_collection.find().sort('timestamp', -1).limit(limit))

def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    from bson import ObjectId
    notifications_collection = get_collection('notifications')
    result = notifications_collection.update_one(
        {'_id': ObjectId(notification_id)},
        {'$set': {'read': True, 'read_at': datetime.utcnow()}}
    )
    return result.modified_count > 0

def mark_all_notifications_as_read():
    """Mark all notifications as read"""
    notifications_collection = get_collection('notifications')
    result = notifications_collection.update_many(
        {'read': False},
        {'$set': {'read': True, 'read_at': datetime.utcnow()}}
    )
    return result.modified_count

def get_notification_stats():
    """Get notification statistics"""
    notifications_collection = get_collection('notifications')
    total = notifications_collection.count_documents({})
    unread = notifications_collection.count_documents({'read': False})
    today = notifications_collection.count_documents({
        'timestamp': {'$gte': datetime.utcnow() - timedelta(hours=24)}
    })
    
    return {
        'total': total,
        'unread': unread,
        'last_24h': today
    }

def cleanup_old_notifications(days=30):
    """Remove notifications older than specified days"""
    notifications_collection = get_collection('notifications')
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    result = notifications_collection.delete_many({
        'timestamp': {'$lt': cutoff_date}
    })
    return result.deleted_count