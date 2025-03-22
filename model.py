import torch
import torch.nn as nn
import torch.nn.functional as F

class TDQN(nn.Module):
    def __init__(self, input_size=117, hidden_size=512):
        super(TDQN, self).__init__()
        
        # Fully connected layers with batch normalization
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.bn1 = nn.BatchNorm1d(hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.bn2 = nn.BatchNorm1d(hidden_size)
        self.fc3 = nn.Linear(hidden_size, hidden_size)
        self.bn3 = nn.BatchNorm1d(hidden_size)
        self.fc4 = nn.Linear(hidden_size, hidden_size)
        self.bn4 = nn.BatchNorm1d(hidden_size)
        self.fc5 = nn.Linear(hidden_size, 2)
        
        # Dropout
        self.dropout = nn.Dropout(0.2)
        
    def forward(self, x, position):
        # Flatten the input if it's 3D (batch, seq_len, features)
        if len(x.shape) == 3:
            x = x.reshape(x.size(0), -1)
        
        # Forward through fully connected layers with batch normalization
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout(x)
        
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.dropout(x)
        
        x = self.fc3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.dropout(x)
        
        x = self.fc4(x)
        x = self.bn4(x)
        x = F.relu(x)
        x = self.dropout(x)
        
        x = self.fc5(x)
        
        return x 